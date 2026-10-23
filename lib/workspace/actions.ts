"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error: string | null; success?: boolean };

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
};

/** Workspace milik user yang login (yang pertama / default). */
export async function getMyWorkspace(): Promise<Workspace | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data as Workspace) ?? null;
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
  const { data: existing } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    workspaceId = existing.id as string;
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

/** Jadikan template default workspace (dipakai untuk invoice baru). */
export async function setDefaultTemplate(templateId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi." };
  const { error } = await supabase
    .from("workspaces")
    .update({ default_template_id: templateId })
    .eq("owner_user_id", user.id);
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
