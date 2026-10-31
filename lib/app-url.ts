/**
 * Alamat publik aplikasi, dipakai untuk menyusun tautan di email
 * (link invoice & reset password).
 *
 * Urutan sumber:
 * 1. NEXT_PUBLIC_APP_URL — disetel manual, paling dipercaya (domain sendiri).
 * 2. VERCEL_PROJECT_PRODUCTION_URL — domain produksi, diisi Vercel otomatis.
 *    Dipakai juga oleh deployment preview supaya tautan email selalu mengarah
 *    ke alamat produksi yang stabil, bukan URL preview yang berubah tiap build.
 * 3. VERCEL_URL — URL deployment saat ini (cadangan terakhir di Vercel).
 * 4. localhost saat pengembangan.
 *
 * Mengembalikan string kosong bila tidak satu pun tersedia, supaya pemanggil
 * bisa menampilkan pesan yang jelas alih-alih mengirim tautan rusak.
 */
export function appUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return withProtocol(explicit);

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (vercel) return withProtocol(vercel);

  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  return "";
}

/** Vercel memberi host tanpa skema (mis. "bayaroinv.vercel.app"). */
function withProtocol(value: string): string {
  const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return url.replace(/\/+$/, "");
}
