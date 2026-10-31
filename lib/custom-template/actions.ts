"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  STARTERS,
  parseLayout,
  safeLayout,
  customTemplateId,
  type StarterKey,
} from "./schema";
import {
  LETTERHEAD_BUCKET,
  MAX_LETTERHEAD_BYTES,
  isLetterheadUrl,
  type CustomTemplateRecord,
  type CustomTemplateSummary,
} from "./types";

async function ctx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi." as string };
  const { data: ws } = await supabase
    .from("workspaces")
    .select("id,default_template_id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!ws) return { error: "Workspace tidak ditemukan." as string };
  return { supabase, workspaceId: ws.id as string, defaultTemplateId: (ws.default_template_id as string) ?? "jasa" };
}

const clampOffset = (n: unknown) => {
  const v = Math.round(Number(n));
  // A4 = 1123px tinggi; area aman tak boleh menelan seluruh halaman.
  return Number.isFinite(v) ? Math.min(Math.max(v, 0), 600) : 0;
};

/** Daftar template kustom milik workspace (tanpa batas jumlah). */
export async function listCustomTemplates(): Promise<CustomTemplateSummary[]> {
  const c = await ctx();
  if ("error" in c) return [];
  const { data, error } = await c.supabase
    .from("custom_templates")
    .select("id,name,updated_at,letterhead_url")
    .eq("workspace_id", c.workspaceId)
    .order("updated_at", { ascending: false });
  if (error) return []; // mis. migrasi belum dijalankan: jangan jatuhkan halaman
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    updatedAt: r.updated_at as string,
    hasLetterhead: !!r.letterhead_url,
  }));
}

/** Satu template, dengan layout yang sudah dijamin aman untuk dirender. */
export async function getCustomTemplate(id: string): Promise<CustomTemplateRecord | null> {
  const c = await ctx();
  if ("error" in c) return null;
  const { data } = await c.supabase
    .from("custom_templates")
    .select("id,name,layout,letterhead_url,letterhead_top,letterhead_bottom,updated_at")
    .eq("id", id)
    .eq("workspace_id", c.workspaceId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    name: data.name as string,
    layout: safeLayout(data.layout),
    letterheadUrl: (data.letterhead_url as string) ?? null,
    letterheadTop: Number(data.letterhead_top) || 0,
    letterheadBottom: Number(data.letterhead_bottom) || 0,
    updatedAt: data.updated_at as string,
  };
}

/** Semua template kustom beserta layout-nya — untuk pemilih & pratinjau editor. */
export async function listCustomTemplateRecords(): Promise<CustomTemplateRecord[]> {
  const c = await ctx();
  if ("error" in c) return [];
  const { data, error } = await c.supabase
    .from("custom_templates")
    .select("id,name,layout,letterhead_url,letterhead_top,letterhead_bottom,updated_at")
    .eq("workspace_id", c.workspaceId)
    .order("updated_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    layout: safeLayout(r.layout),
    letterheadUrl: (r.letterhead_url as string) ?? null,
    letterheadTop: Number(r.letterhead_top) || 0,
    letterheadBottom: Number(r.letterhead_bottom) || 0,
    updatedAt: r.updated_at as string,
  }));
}

/** Buat template baru dari salah satu titik awal. */
export async function createCustomTemplate(
  starter: StarterKey
): Promise<{ error: string | null; id?: string }> {
  const c = await ctx();
  if ("error" in c) return { error: c.error ?? "Terjadi kesalahan." };
  const base = STARTERS[starter];
  if (!base) return { error: "Titik awal tidak dikenal." };

  const { data, error } = await c.supabase
    .from("custom_templates")
    .insert({ workspace_id: c.workspaceId, name: `${base.name} (kustom)`, layout: base.layout })
    .select("id")
    .single();
  if (error || !data) return { error: "Gagal membuat template." };
  return { error: null, id: data.id as string };
}

/** Simpan perubahan. Layout divalidasi ketat — nilai asing ditolak/dibuang. */
export async function saveCustomTemplate(
  id: string,
  input: { name: string; layout: unknown; letterheadTop?: number; letterheadBottom?: number }
): Promise<{ error: string | null }> {
  const c = await ctx();
  if ("error" in c) return { error: c.error ?? "Terjadi kesalahan." };

  const name = (input.name ?? "").trim().slice(0, 80);
  if (!name) return { error: "Nama template wajib diisi." };

  const parsed = parseLayout(input.layout);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await c.supabase
    .from("custom_templates")
    .update({
      name,
      layout: parsed.layout,
      letterhead_top: clampOffset(input.letterheadTop),
      letterhead_bottom: clampOffset(input.letterheadBottom),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("workspace_id", c.workspaceId);
  return { error: error ? "Gagal menyimpan template." : null };
}

/** Catat URL kop surat yang sudah diunggah browser ke bucket "letterheads". */
export async function setLetterheadUrl(id: string, url: string): Promise<{ error: string | null }> {
  const c = await ctx();
  if ("error" in c) return { error: c.error ?? "Terjadi kesalahan." };
  if (!isLetterheadUrl(url)) return { error: "URL kop surat tidak valid." };

  const { error } = await c.supabase
    .from("custom_templates")
    .update({ letterhead_url: url, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", c.workspaceId);
  return { error: error ? "Gagal menyimpan kop surat." : null };
}

/**
 * Cadangan bila unggahan langsung dari browser ditolak policy storage.
 * Kepemilikan sudah diverifikasi di sini, lalu dipakai service role.
 */
export async function uploadLetterhead(
  formData: FormData
): Promise<{ error: string | null; url?: string }> {
  const c = await ctx();
  if ("error" in c) return { error: c.error ?? "Terjadi kesalahan." };

  const id = String(formData.get("templateId") ?? "");
  const { data: tpl } = await c.supabase
    .from("custom_templates")
    .select("id")
    .eq("id", id)
    .eq("workspace_id", c.workspaceId)
    .maybeSingle();
  if (!tpl) return { error: "Template tidak ditemukan." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Berkas kop surat tidak valid." };
  if (file.size > MAX_LETTERHEAD_BYTES) return { error: "Ukuran berkas maksimal 5 MB." };
  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : null;
  if (!ext) return { error: "Format harus PNG atau JPG (PDF diubah di browser)." };

  const admin = createAdminClient();
  const path = `${c.workspaceId}/${id}-${Date.now()}.${ext}`;
  const { error: upErr } = await admin.storage
    .from(LETTERHEAD_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) return { error: `Gagal mengunggah kop surat: ${upErr.message}` };

  const url = admin.storage.from(LETTERHEAD_BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await admin
    .from("custom_templates")
    .update({ letterhead_url: url, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", c.workspaceId);
  return error ? { error: "Gagal menyimpan kop surat." } : { error: null, url };
}

/** Lepas kop surat dari template (berkas lama dibiarkan di storage). */
export async function removeLetterhead(id: string): Promise<{ error: string | null }> {
  const c = await ctx();
  if ("error" in c) return { error: c.error ?? "Terjadi kesalahan." };
  const { error } = await c.supabase
    .from("custom_templates")
    .update({ letterhead_url: null, letterhead_top: 0, letterhead_bottom: 0, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", c.workspaceId);
  return { error: error ? "Gagal melepas kop surat." : null };
}

/** Duplikat template (termasuk kop suratnya). */
export async function duplicateCustomTemplate(id: string): Promise<{ error: string | null; id?: string }> {
  const c = await ctx();
  if ("error" in c) return { error: c.error ?? "Terjadi kesalahan." };
  const src = await getCustomTemplate(id);
  if (!src) return { error: "Template tidak ditemukan." };

  const { data, error } = await c.supabase
    .from("custom_templates")
    .insert({
      workspace_id: c.workspaceId,
      name: `${src.name} (salinan)`.slice(0, 80),
      layout: src.layout,
      letterhead_url: src.letterheadUrl,
      letterhead_top: src.letterheadTop,
      letterhead_bottom: src.letterheadBottom,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "Gagal menduplikat template." };
  return { error: null, id: data.id as string };
}

/** Berapa invoice yang sedang memakai template ini (untuk modal hapus). */
export async function countTemplateUsage(id: string): Promise<number> {
  const c = await ctx();
  if ("error" in c) return 0;
  const { count } = await c.supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", c.workspaceId)
    .eq("template_id", customTemplateId(id));
  return count ?? 0;
}

/**
 * Hapus template. Invoice yang memakainya dialihkan ke template "Jasa"
 * (bukan error), begitu juga bila template ini sedang jadi default.
 */
export async function deleteCustomTemplate(id: string): Promise<{ error: string | null; moved?: number }> {
  const c = await ctx();
  if ("error" in c) return { error: c.error ?? "Terjadi kesalahan." };
  const tid = customTemplateId(id);

  const { data: moved, error: moveErr } = await c.supabase
    .from("invoices")
    .update({ template_id: "jasa" })
    .eq("workspace_id", c.workspaceId)
    .eq("template_id", tid)
    .select("id");
  if (moveErr) return { error: "Gagal memindahkan invoice ke template Jasa." };

  if (c.defaultTemplateId === tid) {
    await c.supabase.from("workspaces").update({ default_template_id: "jasa" }).eq("id", c.workspaceId);
  }

  const { error } = await c.supabase
    .from("custom_templates")
    .delete()
    .eq("id", id)
    .eq("workspace_id", c.workspaceId);
  if (error) return { error: "Gagal menghapus template." };
  return { error: null, moved: moved?.length ?? 0 };
}
