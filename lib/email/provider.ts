/**
 * Penyedia pengiriman email. Dua-duanya didukung supaya bisa berpindah tanpa
 * ubah kode: cukup ganti environment variable lalu redeploy.
 *
 * - Brevo  : verifikasi cukup per ALAMAT email, jadi bisa kirim ke klien mana
 *            pun tanpa punya domain. Alamat pengirim dari domain gratisan
 *            (gmail.com dll) ditulis ulang oleh Brevo.
 * - Resend : butuh DOMAIN terverifikasi; tanpa itu hanya bisa kirim ke pemilik
 *            akun. Pilihan terbaik begitu domain sendiri tersedia.
 *
 * Bila keduanya terisi, Brevo dipakai lebih dulu.
 */

export type EmailProvider = "brevo" | "resend";

/** Domain email gratisan — Brevo menulis ulang pengirim dari domain ini. */
const FREE_MAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.id",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
];

export function emailProvider(): EmailProvider | null {
  if (process.env.BREVO_API_KEY?.trim()) return "brevo";
  if (process.env.RESEND_API_KEY?.trim()) return "resend";
  return null;
}

export type SenderAddress = { email: string; name?: string };

/**
 * Baca EMAIL_FROM. Menerima "nama@domain" atau "Nama <nama@domain>".
 * Mengembalikan null bila formatnya salah, supaya kegagalan ketahuan sejak
 * awal dan tidak terkirim diam-diam dengan alamat ngawur.
 */
export function parseFrom(raw: string | undefined): SenderAddress | null {
  const value = raw?.trim();
  if (!value) return null;

  const withName = /^(.*?)\s*<([^<>]+)>$/.exec(value);
  const email = (withName ? withName[2] : value).trim();
  const name = withName ? withName[1].trim().replace(/^"|"$/g, "") : undefined;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return name ? { email, name } : { email };
}

/** Alamat pengirim efektif; Resend punya default domain uji, Brevo tidak. */
export function senderAddress(provider: EmailProvider): SenderAddress | null {
  const parsed = parseFrom(process.env.EMAIL_FROM);
  if (parsed) return parsed;
  return provider === "resend" ? { email: "onboarding@resend.dev", name: "Bayaro" } : null;
}

/**
 * Nama tampilan pengirim, mis. "Lebah Studio". Dibersihkan karena nama ini
 * masuk ke header email: karakter kontrol & tanda kutip bisa merusaknya.
 */
export function sanitizeSenderName(name: string | null | undefined): string {
  const clean = (name ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/["'<>,;:\\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return clean || "Bayaro";
}

/**
 * Catatan untuk ditampilkan di UI bila pengiriman masih terbatas.
 * null = siap dipakai ke klien mana pun.
 */
export function senderNotice(): string | null {
  const provider = emailProvider();
  if (!provider) return null;

  const from = senderAddress(provider);
  if (!from) {
    return "Alamat pengirim (EMAIL_FROM) belum diisi di server, jadi email belum bisa dikirim.";
  }

  const domain = from.email.split("@")[1]?.toLowerCase() ?? "";

  if (provider === "resend") {
    if (domain === "resend.dev") {
      return "Pengirim masih memakai domain uji Resend, jadi email hanya sampai ke alamat pemilik akun Resend dan sering masuk Spam. Verifikasi domain sendiri agar bisa mengirim ke klien mana pun.";
    }
    return null;
  }

  if (FREE_MAIL_DOMAINS.includes(domain)) {
    return `Email terkirim ke klien mana pun, tetapi karena pengirimnya alamat gratisan (${domain}), Brevo mengganti alamat pengirim dengan alamat miliknya. Pakai domain sendiri agar invoice terkirim atas nama usahamu.`;
  }
  return null;
}
