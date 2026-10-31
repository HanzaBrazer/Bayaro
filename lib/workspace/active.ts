import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Satu-satunya cara menentukan workspace aktif (multi-workspace).
 *
 * Membaca users.active_workspace_id lalu MEMVERIFIKASI workspace itu masih
 * milik user. Kosong / tidak valid / milik orang lain → workspace tertua milik
 * user (perilaku lama sebelum multi-workspace).
 *
 * Modul server biasa (bukan "use server") agar tidak bisa dipanggil dari klien.
 */
export async function getActiveWorkspaceId(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const [{ data: profile }, { data: owned }] = await Promise.all([
    supabase.from("users").select("active_workspace_id").eq("id", userId).maybeSingle(),
    supabase
      .from("workspaces")
      .select("id")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: true }),
  ]);
  const ids = (owned ?? []).map((w: { id: string }) => w.id);
  if (ids.length === 0) return null;

  const wanted = (profile?.active_workspace_id as string | null) ?? null;
  return wanted && ids.includes(wanted) ? wanted : ids[0];
}

/**
 * Halaman detail (invoice, klien, template kustom) bisa dibuka lewat link lama
 * dari workspace lain milik user yang sama. Bila begitu, pindahkan workspace
 * aktif ke workspace pemilik data itu. Mengembalikan true bila terjadi
 * perpindahan — pemanggil sebaiknya redirect ke URL yang sama supaya sidebar
 * ikut menampilkan workspace yang benar.
 *
 * Data milik user lain tidak terlihat karena RLS, jadi tidak pernah dipindahkan.
 */
export async function followRecordWorkspace(
  table: "invoices" | "clients" | "custom_templates",
  id: string
): Promise<boolean> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const [{ data: row }, activeId] = await Promise.all([
    supabase.from(table).select("workspace_id").eq("id", id).maybeSingle(),
    getActiveWorkspaceId(supabase, user.id),
  ]);
  const target = (row?.workspace_id as string | undefined) ?? null;
  if (!target || target === activeId) return false;
  return setActiveWorkspaceId(supabase, user.id, target);
}

/** Jadikan workspace aktif. Kepemilikan diverifikasi dulu. */
export async function setActiveWorkspaceId(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const { data: ws } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (!ws) return false;
  const { error } = await supabase.from("users").update({ active_workspace_id: workspaceId }).eq("id", userId);
  return !error;
}
