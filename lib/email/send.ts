/**
 * Pengiriman email lewat REST API Resend — tanpa dependensi npm tambahan.
 * Aktif otomatis begitu RESEND_API_KEY diisi; bila kosong, UI memakai
 * fallback (membuka aplikasi email pengguna lewat mailto:).
 */

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/** Alamat pengirim. Tanpa domain terverifikasi, Resend hanya mengizinkan domain ujinya. */
function fromAddress(): string {
  return process.env.EMAIL_FROM || "Bayaro <onboarding@resend.dev>";
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ error: string | null }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { error: "Pengiriman email belum dikonfigurasi di server." };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      // Pesan Resend cukup informatif (mis. domain belum terverifikasi).
      return { error: (data as { message?: string }).message || `Gagal mengirim email (${res.status}).` };
    }
    return { error: null };
  } catch {
    return { error: "Gagal menghubungi layanan email." };
  }
}

/** Template email invoice (inline CSS agar aman di berbagai klien email). */
export function invoiceEmailHtml(input: {
  businessName: string;
  clientName: string;
  number: string;
  totalFormatted: string;
  dueDateFormatted: string | null;
  url: string;
}): string {
  const { businessName, clientName, number, totalFormatted, dueDateFormatted, url } = input;
  return `<!doctype html>
<html lang="id"><body style="margin:0;padding:24px;background:#F7F6F3;font-family:'Segoe UI',Arial,sans-serif;color:#1C1A17;">
  <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border:1px solid #E7E3DA;border-radius:16px;overflow:hidden;">
    <div style="background:#2E7D5B;padding:20px 24px;color:#FFFFFF;">
      <div style="font-size:13px;opacity:.85;">Invoice dari</div>
      <div style="font-size:18px;font-weight:700;">${escapeHtml(businessName)}</div>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 16px;font-size:14px;">Halo ${escapeHtml(clientName || "Bapak/Ibu")},</p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">
        Berikut invoice <strong>${escapeHtml(number)}</strong> untuk Anda.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #E7E3DA;color:#6B655B;">Total tagihan</td>
          <td style="padding:10px 0;border-bottom:1px solid #E7E3DA;text-align:right;font-weight:700;">${escapeHtml(totalFormatted)}</td>
        </tr>
        ${
          dueDateFormatted
            ? `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #E7E3DA;color:#6B655B;">Jatuh tempo</td>
          <td style="padding:10px 0;border-bottom:1px solid #E7E3DA;text-align:right;">${escapeHtml(dueDateFormatted)}</td>
        </tr>`
            : ""
        }
      </table>
      <a href="${escapeHtml(url)}" style="display:inline-block;background:#2E7D5B;color:#FFFFFF;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px;">
        Lihat &amp; unduh invoice
      </a>
      <p style="margin:20px 0 0;font-size:12px;color:#6B655B;line-height:1.6;">
        Sudah melakukan pembayaran? Buka tautan di atas lalu tekan
        <strong>&ldquo;Saya sudah membayar&rdquo;</strong> dan unggah bukti transfer.
      </p>
    </div>
    <div style="padding:14px 24px;background:#F7F6F3;font-size:11px;color:#6B655B;text-align:center;">
      Dibuat dengan Bayaro
    </div>
  </div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
