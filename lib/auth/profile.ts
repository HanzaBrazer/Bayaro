import { createClient } from "@/lib/supabase/server";

export interface AccountProfile {
  /** Nama tampilan: full_name, atau bagian sebelum "@" pada email. */
  name: string;
  /** Alamat email yang dipakai login. */
  email: string;
  /** Huruf untuk avatar, selalu kapital. */
  initial: string;
}

/**
 * Identitas pengguna yang sedang login untuk menu akun.
 * Dipanggil dari server component (bukan server action) lalu diteruskan
 * sebagai props — komponen client tidak boleh memanggil Supabase sendiri.
 */
export async function getAccountProfile(): Promise<AccountProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const email = (user.email ?? "").trim();

  // Nama dari tabel profil; gagal-diam agar menu tidak pernah menjatuhkan layout.
  let full = "";
  const { data } = await supabase.from("users").select("full_name").eq("id", user.id).maybeSingle();
  full = ((data?.full_name as string | null) ?? "").trim();

  const localPart = email.includes("@") ? email.slice(0, email.indexOf("@")) : email;
  const name = full || localPart || "Akun";
  const initial = (name.charAt(0) || email.charAt(0) || "A").toUpperCase();

  return { name, email, initial };
}
