"use server";

import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatDateID } from "@/lib/utils";
import { sendEmail, invoiceEmailHtml, isEmailConfigured } from "@/lib/email/send";

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

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
  if (!base) return { error: "NEXT_PUBLIC_APP_URL belum diisi di server." };

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
