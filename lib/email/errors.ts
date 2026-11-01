import type { EmailProvider } from "./provider";

/**
 * Ubah kegagalan penyedia email jadi pesan berbahasa Indonesia yang bisa
 * ditindaklanjuti. Teks asli (bahasa Inggris, menyebut nama penyedia) hanya
 * dicatat di log server — pengguna Bayaro tidak perlu membaca istilah teknis
 * milik layanan pihak ketiga.
 */
export function emailErrorMessage(provider: EmailProvider, status: number, raw: string): string {
  const text = raw.toLowerCase();

  // Dicek lebih dulu: Resend mengirim pesan ini dengan status 403, yang kalau
  // diperiksa belakangan akan salah terbaca sebagai "kunci API tidak berlaku".
  if (text.includes("you can only send testing emails") || text.includes("verify a domain")) {
    return "Domain pengirim belum diverifikasi, jadi email hanya bisa dikirim ke alamat pemilik akun. Verifikasi domain lalu isi EMAIL_FROM, atau kirim lewat tombol Aplikasi email.";
  }

  if (status === 401 || status === 403) {
    if (text.includes("ip") && text.includes("authoriz")) {
      return "Alamat IP server belum diizinkan di akun Brevo. Buka Brevo → Security → Authorized IPs, lalu izinkan semua IP.";
    }
    return "Kunci API email tidak berlaku. Perbarui kunci di server lalu redeploy.";
  }

  if (status === 429) {
    return "Terlalu banyak email dalam waktu singkat, atau jatah harian sudah habis. Coba lagi nanti.";
  }

  // Brevo: alamat pengirim belum dikonfirmasi lewat email verifikasi.
  if (text.includes("sender") && (text.includes("not valid") || text.includes("not found") || text.includes("invalid"))) {
    return "Alamat pengirim belum diverifikasi di Brevo. Buka Brevo → Senders, tambahkan alamat itu, lalu klik tautan konfirmasi yang dikirim ke email tersebut.";
  }

  if (status === 400 || status === 422) {
    if (text.includes("recipient") || text.includes("to")) return "Alamat email penerima tidak diterima layanan email.";
    return "Data email ditolak layanan email. Periksa alamat pengirim dan penerima.";
  }

  return `Gagal mengirim email (kode ${status}). Coba lagi beberapa saat lagi.`;
}
