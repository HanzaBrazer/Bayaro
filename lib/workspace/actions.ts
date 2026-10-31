"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveWorkspaceId, setActiveWorkspaceId } from "./active";
import { newWorkspaceSchema, templateForBusiness, type NewWorkspaceInput } from "./business";

export type OnboardingState = { error: string | null; success?: boolean };

export type WorkspaceSummary = { id: string; name: string; logoUrl: string | null };

export type Workspace = {
  id: string;
  name: string | null;
  logo_url: string | null;
  address: string | null;
  bank_account: string | null;
  npwp: string | null;
  invoice_prefix: string | null;
  next_invoice_number: number | null;
  default_template_id: string | null;
  // Detail identitas usaha (migrasi 0005)
  phone: string | null;
  email: string | null;
  website: string | null;
  signatory: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  terms: string | null;
};

/** User + workspace aktif. Semua perubahan profil HANYA menyentuh workspace ini. */
async function activeCtx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi." as string };
  const workspaceId = await getActiveWorkspaceId(supabase, user.id);
  if (!workspaceId) return { error: "Workspace tidak ditemukan." as string };
  return { supabase, user, workspaceId };
}

/** Workspace yang sedang aktif milik user yang login. */
export async function getMyWorkspace(): Promise<Workspace | null> {
  const c = await activeCtx();
  if ("error" in c) return null;
  const { data } = await c.supabase.from("workspaces").select("*").eq("id", c.workspaceId).maybeSingle();
  return (data as Workspace) ?? null;
}

/** Semua workspace milik user (untuk switcher), urut dari yang tertua. */
export async function listMyWorkspaces(): Promise<{ activeId: string | null; workspaces: WorkspaceSummary[] }> {
  const c = await activeCtx();
  if ("error" in c) return { activeId: null, workspaces: [] };
  const { data } = await c.supabase
    .from("workspaces")
    .select("id,name,logo_url")
    .eq("owner_user_id", c.user.id)
    .order("created_at", { ascending: true });
  return {
    activeId: c.workspaceId,
    workspaces: (data ?? []).map((w: { id: string; name: string | null; logo_url: string | null }) => ({
      id: w.id,
      name: w.name?.trim() || "Usaha Saya",
      logoUrl: w.logo_url ?? null,
    })),
  };
}

/**
 * Buat workspace baru (bisnis lain) lalu jadikan aktif. Gratis untuk semua
 * paket, tanpa batas jumlah — kuota invoice tetap dihitung per akun.
 * Logo diunggah browser SETELAH workspace ada (butuh id untuk path-nya).
 */
export async function createWorkspace(
  input: NewWorkspaceInput
): Promise<{ error: string | null; id?: string; field?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi." };

  const parsed = newWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message ?? "Data belum lengkap.", field: issue?.path[0]?.toString() };
  }
  const v = parsed.data;

  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      owner_user_id: user.id,
      name: v.name,
      address: v.address,
      phone: v.phone,
      email: v.email,
      website: v.website,
      bank_name: v.bankName,
      account_number: v.accountNumber,
      account_holder: v.accountHolder,
      signatory: v.signatory,
      invoice_prefix: v.prefix,
      next_invoice_number: v.startNumber,
      default_template_id: templateForBusiness(v.businessType),
    })
    .select("id")
    .single();
  if (error || !data) return { error: "Gagal membuat workspace. Coba lagi." };

  const id = data.id as string;
  if (!(await setActiveWorkspaceId(supabase, user.id, id))) {
    // Workspace sudah dibuat; hanya gagal dijadikan aktif (mis. migrasi 0010 belum dijalankan).
    return { error: "Workspace dibuat, tapi gagal dibuka otomatis. Pilih lewat menu workspace.", id };
  }
  revalidatePath("/", "layout");
  return { error: null, id };
}

/** Pindah workspace aktif. Kepemilikan diverifikasi di server. */
export async function switchWorkspace(workspaceId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi." };
  const ok = await setActiveWorkspaceId(supabase, user.id, workspaceId);
  if (!ok) return { error: "Workspace tidak ditemukan." };
  revalidatePath("/", "layout");
  return { error: null };
}

export async function saveOnboardingAction(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nama usaha wajib diisi." };

  const address = String(formData.get("address") ?? "").trim() || null;
  const bankAccount = String(formData.get("bank_account") ?? "").trim() || null;
  const prefix = String(formData.get("invoice_prefix") ?? "").trim() || "INV-";

  // Cari workspace user (dibuat trigger); buat bila belum ada.
  let workspaceId: string | null = null;
  const existing = await getActiveWorkspaceId(supabase, user.id);

  if (existing) {
    workspaceId = existing;
  } else {
    const { data: created, error: insErr } = await supabase
      .from("workspaces")
      .insert({ owner_user_id: user.id, name })
      .select("id")
      .single();
    if (insErr || !created) return { error: "Gagal membuat workspace." };
    workspaceId = created.id as string;
  }

  // Upload logo (opsional)
  let logoUrl: string | undefined;
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    if (file.size > 2 * 1024 * 1024) return { error: "Ukuran logo maksimal 2 MB." };
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${workspaceId}/logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("workspace-logos")
      .upload(path, file, { upsert: true, contentType: file.type || undefined });
    if (upErr) return { error: "Gagal mengunggah logo. Coba lagi." };
    logoUrl = supabase.storage.from("workspace-logos").getPublicUrl(path).data.publicUrl;
  }

  const update: Record<string, unknown> = {
    name,
    address,
    bank_account: bankAccount,
    invoice_prefix: prefix,
  };
  if (logoUrl) update.logo_url = logoUrl;

  const { error: updErr } = await supabase.from("workspaces").update(update).eq("id", workspaceId);
  if (updErr) return { error: "Gagal menyimpan profil usaha." };

  await supabase.from("users").update({ onboarded: true }).eq("id", user.id);

  return { error: null, success: true };
}

/** Simpan profil usaha (Pengaturan > Profil). */
export async function saveWorkspaceProfile(input: {
  name: string;
  address: string;
  bankAccount: string;
  phone?: string;
  email?: string;
  website?: string;
  signatory?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  terms?: string;
}): Promise<{ error: string | null }> {
  const c = await activeCtx();
  if ("error" in c) return { error: c.error ?? "Terjadi kesalahan." };
  if (!input.name.trim()) return { error: "Nama usaha wajib diisi." };
  const norm = (v?: string) => (v && v.trim() ? v.trim() : null);
  const { error } = await c.supabase
    .from("workspaces")
    .update({
      name: input.name.trim(),
      address: norm(input.address),
      bank_account: norm(input.bankAccount),
      phone: norm(input.phone),
      email: norm(input.email),
      website: norm(input.website),
      signatory: norm(input.signatory),
      bank_name: norm(input.bankName),
      account_number: norm(input.accountNumber),
      account_holder: norm(input.accountHolder),
      terms: norm(input.terms),
    })
    .eq("id", c.workspaceId);
  return { error: error ? "Gagal menyimpan profil." : null };
}

/** Unggah / ganti logo usaha (Pengaturan > Profil). Opsional. */
export async function uploadWorkspaceLogo(
  formData: FormData
): Promise<{ error: string | null; logoUrl?: string }> {
  const c = await activeCtx();
  if ("error" in c) return { error: c.error ?? "Terjadi kesalahan." };
  const ws = { id: c.workspaceId };

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: "File logo tidak valid." };
  if (file.size > 2 * 1024 * 1024) return { error: "Ukuran logo maksimal 2 MB." };

  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${ws.id}/logo-${Date.now()}.${ext}`;

  // Pakai service role: kepemilikan workspace sudah diverifikasi di atas, dan
  // ini kebal dari policy storage yang kurang pas. Error asli ikut dilaporkan.
  const admin = createAdminClient();
  const { error: upErr } = await admin.storage
    .from("workspace-logos")
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (upErr) return { error: `Gagal mengunggah logo: ${upErr.message}` };

  const logoUrl = admin.storage.from("workspace-logos").getPublicUrl(path).data.publicUrl;
  const { error: updErr } = await admin.from("workspaces").update({ logo_url: logoUrl }).eq("id", ws.id);
  if (updErr) return { error: "Gagal menyimpan logo." };

  return { error: null, logoUrl };
}

/** Simpan penomoran invoice (Pengaturan > Penomoran). */
export async function saveNumbering(input: {
  prefix: string;
  nextNumber: number;
}): Promise<{ error: string | null }> {
  const c = await activeCtx();
  if ("error" in c) return { error: c.error ?? "Terjadi kesalahan." };
  const next = Math.max(1, Math.floor(input.nextNumber || 1));
  const { error } = await c.supabase
    .from("workspaces")
    .update({ invoice_prefix: input.prefix.trim() || "INV-", next_invoice_number: next })
    .eq("id", c.workspaceId);
  return { error: error ? "Gagal menyimpan penomoran." : null };
}

/** Jadikan template default workspace (dipakai untuk invoice baru). */
export async function setDefaultTemplate(templateId: string): Promise<{ error: string | null }> {
  const c = await activeCtx();
  if ("error" in c) return { error: c.error ?? "Terjadi kesalahan." };
  const { error } = await c.supabase
    .from("workspaces")
    .update({ default_template_id: templateId })
    .eq("id", c.workspaceId);
  return { error: error ? "Gagal mengubah template default." : null };
}

/** Lewati onboarding: tandai sudah onboarding, lalu ke /invoices. */
export async function skipOnboardingAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("users").update({ onboarded: true }).eq("id", user.id);
  }
  redirect("/invoices");
}

/**
 * Simpan URL logo setelah file diunggah LANGSUNG dari browser ke Supabase Storage.
 * Menghindari batas body Server Action (file tak melewati server sama sekali).
 * URL divalidasi harus berasal dari bucket publik kita.
 */
export async function setWorkspaceLogoUrl(url: string): Promise<{ error: string | null }> {
  const c = await activeCtx();
  if ("error" in c) return { error: c.error ?? "Terjadi kesalahan." };

  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/workspace-logos/`;
  if (!url || !base.startsWith("http") || !url.startsWith(base)) {
    return { error: "URL logo tidak valid." };
  }

  const { error } = await c.supabase.from("workspaces").update({ logo_url: url }).eq("id", c.workspaceId);
  return { error: error ? "Gagal menyimpan logo." : null };
}
