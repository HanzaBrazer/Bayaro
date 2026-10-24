"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanFor } from "@/lib/plan/quota";
import { createSnapTransaction } from "@/lib/midtrans/snap";
import { getTransactionStatus } from "@/lib/midtrans/status";
import { PRO_PRICE, PRO_DAYS, type BillingInfo } from "./constants";

export async function getBilling(): Promise<BillingInfo> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { plan: "free", currentPeriodEnd: null, price: PRO_PRICE, history: [] };

  // Self-heal: jika order terakhir masih "pending" padahal sudah dibayar
  // (webhook belum/tak masuk, mis. di localhost), cek ke Midtrans & aktifkan.
  await reconcileLatestPending(user.id);

  const plan = await getPlanFor(supabase, user.id);
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("id,midtrans_order_id,status,plan,current_period_end,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const active = (subs ?? []).find((s) => s.plan === "pro" && s.status === "active");
  return {
    plan,
    currentPeriodEnd: (active?.current_period_end as string) ?? null,
    price: PRO_PRICE,
    history: (subs ?? []).map((s) => ({
      id: s.id as string,
      order_id: (s.midtrans_order_id as string) ?? null,
      status: s.status as string,
      plan: s.plan as string,
      created_at: s.created_at as string,
    })),
  };
}

/**
 * Cek order "pending" terbaru (maks 5) ke Midtrans; aktifkan Pro bila ada yang
 * sudah settlement/capture, dan tandai yang gagal/kedaluwarsa jadi inactive.
 * Dipakai getBilling() agar status sinkron walau webhook tak masuk. Idempotent.
 */
async function reconcileLatestPending(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: pendings } = await admin
    .from("subscriptions")
    .select("id,status,midtrans_order_id,created_at")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);
  if (!pendings || pendings.length === 0) return;

  for (const sub of pendings) {
    if (!sub.midtrans_order_id) continue;
    const st = await getTransactionStatus(sub.midtrans_order_id as string);
    const paid =
      (st.transactionStatus === "settlement" || st.transactionStatus === "capture") &&
      (st.fraudStatus === undefined || st.fraudStatus === "accept");

    if (paid) {
      const end = new Date();
      end.setDate(end.getDate() + PRO_DAYS);
      await admin
        .from("subscriptions")
        .update({ status: "active", current_period_end: end.toISOString(), updated_at: new Date().toISOString() })
        .eq("id", sub.id);
      return; // cukup satu yang aktif
    }
    if (["deny", "cancel", "expire", "failure"].includes(st.transactionStatus)) {
      await admin
        .from("subscriptions")
        .update({ status: "inactive", updated_at: new Date().toISOString() })
        .eq("id", sub.id);
    }
  }
}

export async function createUpgradeOrder(): Promise<{ token?: string; orderId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi." };

  const { data: profile } = await supabase.from("users").select("email,full_name").eq("id", user.id).maybeSingle();

  const orderId = `BAYARO-PRO-${user.id.slice(0, 8)}-${Date.now()}`;
  const { error: insErr } = await supabase
    .from("subscriptions")
    .insert({ user_id: user.id, plan: "pro", status: "pending", midtrans_order_id: orderId });
  if (insErr) return { error: "Gagal membuat order." };

  const snap = await createSnapTransaction({
    orderId,
    grossAmount: PRO_PRICE,
    itemName: "Bayaro Pro (1 bulan)",
    customer: {
      email: (profile?.email as string) ?? user.email ?? "user@bayaro.app",
      name: (profile?.full_name as string) ?? "Pengguna Bayaro",
    },
  });
  if (snap.error || !snap.token) return { error: snap.error ?? "Gagal membuat transaksi Snap." };
  return { token: snap.token, orderId };
}

/**
 * Konfirmasi pembayaran saat kembali dari Snap (dipanggil di callback onSuccess/onPending).
 * Status diverifikasi LANGSUNG ke Midtrans (server-to-server), bukan dari frontend,
 * lalu Pro diaktifkan. Idempotent & aman dijalankan ulang; melengkapi webhook
 * (berguna di localhost / saat webhook belum masuk).
 */
export async function confirmUpgrade(orderId: string): Promise<{ plan: "free" | "pro"; status: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { plan: "free", status: "", error: "Sesi berakhir. Masuk lagi." };
  if (!orderId) return { plan: "free", status: "", error: "Order tidak valid." };

  // Pastikan order ini milik user yang login.
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id,status")
    .eq("midtrans_order_id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!sub) return { plan: "free", status: "", error: "Order tidak ditemukan." };

  // Verifikasi otoritatif ke Midtrans.
  const st = await getTransactionStatus(orderId);
  const paid =
    (st.transactionStatus === "settlement" || st.transactionStatus === "capture") &&
    (st.fraudStatus === undefined || st.fraudStatus === "accept");

  const admin = createAdminClient();
  if (paid) {
    if (sub.status !== "active") {
      const end = new Date();
      end.setDate(end.getDate() + PRO_DAYS);
      await admin
        .from("subscriptions")
        .update({ status: "active", current_period_end: end.toISOString(), updated_at: new Date().toISOString() })
        .eq("id", sub.id);
    }
  } else if (["deny", "cancel", "expire", "failure"].includes(st.transactionStatus)) {
    if (sub.status === "pending") {
      await admin
        .from("subscriptions")
        .update({ status: "inactive", updated_at: new Date().toISOString() })
        .eq("id", sub.id);
    }
  }

  const plan = await getPlanFor(supabase, user.id);
  return { plan, status: st.transactionStatus };
}
