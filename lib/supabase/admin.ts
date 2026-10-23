import { createClient } from "@supabase/supabase-js";

/**
 * Admin client (service role) — HANYA untuk server.
 * Bypass RLS; dipakai mis. baca invoice publik berdasarkan token.
 * Jangan pernah dipakai di komponen client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase admin: env belum lengkap (URL / SERVICE_ROLE_KEY).");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
