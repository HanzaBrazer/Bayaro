"use server";

import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatDateID } from "@/lib/utils";
import { sendEmail, invoiceEmailHtml, isEmailConfigured } from "@/lib/email/send";
import { appUrl } from "@/lib/app-url";

/** Kirim invoice ke email klien dari server (butuh RESEND_API_KEY). */
export async function sendInvoiceEmail(
  invoiceId: string,
  to: string
): Promise<{ error: string | null }> {
  if (!isEmailConfigured()) {
    return { error: "Pengiriman dari server belum aktif. Pakai tombol aplikasi email." };
  }
  const address = to.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return { error: "Alamat email tidak valid." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi." };

  // RLS memastikan invoice ini milik workspace user.
  const { data: inv } = await supabase
    .from("invoices")
    .select("id,number,total,due_date,client_name,public_token,workspace_id")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!inv) return { error: "Invoice tidak ditemukan." };

  const { data: ws } = await supabase
    .from("workspaces")
    .select("name,email")
    .eq("id", inv.workspace_id)
    .maybeSingle();

  const base = appUrl();
  if (!base) {
    return { error: "Alamat aplikasi belum diatur di server. Isi NEXT_PUBLIC_APP_URL lalu redeploy." };
  }

  const html = invoiceEmailHtml({
    businessName: (ws?.name as string) || "Usaha Saya",
    clientName: (inv.client_name as string) || "",
    number: (inv.number as string) || "",
    totalFormatted: `Rp ${formatRupiah(Number(inv.total) || 0)}`,
    dueDateFormatted: inv.due_date ? formatDateID(inv.due_date as string) : null,
    url: `${base}/i/${inv.public_token}`,
  });

  return sendEmail({
    to: address,
    subject: `Invoice ${inv.number} dari ${(ws?.name as string) || "Bayaro"}`,
    html,
    replyTo: (ws?.email as string) || undefined,
  });
}

/* ===================== UNDANGAN & SAKLAR TAUTAN ===================== */

export interface InviteRow {
  id: string;
  email: string;
  lastSentAt: string;
  sendCount: number;
}

const MAX_PER_SEND = 10;
const RESEND_COOLDOWN_MS = 60_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Daftar undangan sebuah invoice (RLS membatasi ke pemilik). */
export async function listInvites(invoiceId: string): Promise<InviteRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Best-effort: jangan pernah menjatuhkan render halaman (mis. bila migrasi
  // 0008 belum dijalankan sehingga tabelnya belum ada).
  const { data, error } = await supabase
    .from("invoice_invites")
    .select("id,email,last_sent_at,send_count")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: true });
  if (error) return [];

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    email: r.email as string,
    lastSentAt: r.last_sent_at as string,
    sendCount: Number(r.send_count) || 1,
  }));
}

/**
 * Undang beberapa alamat sekaligus. Alamat tak valid dilewati tanpa
 * membatalkan yang lain; hasilnya dilaporkan per alamat.
 */
export async function inviteByEmail(
  invoiceId: string,
  rawEmails: string[]
): Promise<{ error: string | null; sent: string[]; failed: { email: string; reason: string }[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi.", sent: [], failed: [] };

  const unique = Array.from(
    new Set(rawEmails.map((e) => e.trim()).filter(Boolean).map((e) => e.toLowerCase()))
  );
  if (unique.length === 0) return { error: "Isi minimal satu alamat email.", sent: [], failed: [] };
  if (unique.length > MAX_PER_SEND) {
    return { error: `Maksimal ${MAX_PER_SEND} alamat sekali kirim.`, sent: [], failed: [] };
  }

  const sent: string[] = [];
  const failed: { email: string; reason: string }[] = [];

  for (const email of unique) {
    if (!EMAIL_RE.test(email)) {
      failed.push({ email, reason: "Format email tidak valid." });
      continue;
    }
    const res = await sendInvoiceEmail(invoiceId, email);
    if (res.error) {
      failed.push({ email, reason: res.error });
      continue;
    }
    // Catat/perbarui baris undangan (RLS memastikan kepemilikan).
    const { data: existing } = await supabase
      .from("invoice_invites")
      .select("id,send_count")
      .eq("invoice_id", invoiceId)
      .ilike("email", email)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("invoice_invites")
        .update({ last_sent_at: new Date().toISOString(), send_count: (Number(existing.send_count) || 1) + 1 })
        .eq("id", existing.id);
    } else {
      await supabase.from("invoice_invites").insert({ invoice_id: invoiceId, email });
    }
    sent.push(email);
  }

  return { error: null, sent, failed };
}

/** Kirim ulang undangan; dibatasi jeda agar tidak jadi saluran spam. */
export async function resendInvite(inviteId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi." };

  const { data: row } = await supabase
    .from("invoice_invites")
    .select("id,invoice_id,email,last_sent_at,send_count")
    .eq("id", inviteId)
    .maybeSingle();
  if (!row) return { error: "Undangan tidak ditemukan." };

  const elapsed = Date.now() - new Date(row.last_sent_at as string).getTime();
  if (elapsed < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
    return { error: `Tunggu ${wait} detik sebelum mengirim ulang.` };
  }

  const res = await sendInvoiceEmail(row.invoice_id as string, row.email as string);
  if (res.error) return { error: res.error };

  await supabase
    .from("invoice_invites")
    .update({ last_sent_at: new Date().toISOString(), send_count: (Number(row.send_count) || 1) + 1 })
    .eq("id", inviteId);

  return { error: null };
}

/** Nonaktifkan / aktifkan kembali tautan publik invoice. */
export async function setLinkActive(
  invoiceId: string,
  active: boolean
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi." };

  const { error } = await supabase
    .from("invoices")
    .update({ link_active: active })
    .eq("id", invoiceId);
  return { error: error ? "Gagal mengubah status tautan." : null };
}
