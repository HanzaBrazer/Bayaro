"use server";

import { createClient } from "@/lib/supabase/server";
import { getPlanFor } from "@/lib/plan/quota";
import { createSnapTransaction } from "@/lib/midtrans/snap";
import { PRO_PRICE, type BillingInfo } from "./constants";

export async function getBilling(): Promise<BillingInfo> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { plan: "free", currentPeriodEnd: null, price: PRO_PRICE, history: [] };

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

export async function createUpgradeOrder(): Promise<{ token?: string; error?: string }> {
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
  return { token: snap.token };
}
