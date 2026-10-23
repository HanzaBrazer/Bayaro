"use server";

import { createClient } from "@/lib/supabase/server";

export interface ClientRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface ClientFormInput {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ClientInvoiceRow {
  id: string;
  number: string;
  issue_date: string;
  total: number;
  status: string;
}

export interface ClientDetail extends ClientRecord {
  invoices: ClientInvoiceRow[];
}

async function ctx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi." as string };
  const { data: ws } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!ws) return { error: "Workspace tidak ditemukan." as string };
  return { supabase, workspaceId: ws.id as string };
}

export async function getClients(): Promise<ClientRecord[]> {
  const c = await ctx();
  if ("error" in c) return [];
  const { data } = await c.supabase
    .from("clients")
    .select("id,name,email,phone,address")
    .eq("workspace_id", c.workspaceId)
    .order("name", { ascending: true });
  return (data ?? []) as ClientRecord[];
}

export async function getClientDetail(id: string): Promise<ClientDetail | null> {
  const c = await ctx();
  if ("error" in c) return null;
  const { data: client } = await c.supabase
    .from("clients")
    .select("id,name,email,phone,address")
    .eq("id", id)
    .maybeSingle();
  if (!client) return null;
  const { data: invoices } = await c.supabase
    .from("invoices")
    .select("id,number,issue_date,total,status")
    .eq("client_id", id)
    .order("created_at", { ascending: false });
  return { ...(client as ClientRecord), invoices: (invoices ?? []) as ClientInvoiceRow[] };
}

export async function createClientRecord(
  input: ClientFormInput
): Promise<{ error: string | null; client?: ClientRecord }> {
  const c = await ctx();
  if ("error" in c) return { error: c.error ?? "Terjadi kesalahan." };
  if (!input.name.trim()) return { error: "Nama klien wajib diisi." };
  const { data, error } = await c.supabase
    .from("clients")
    .insert({
      workspace_id: c.workspaceId,
      name: input.name.trim(),
      email: input.email.trim() || null,
      phone: input.phone.trim() || null,
      address: input.address.trim() || null,
    })
    .select("id,name,email,phone,address")
    .single();
  if (error || !data) return { error: "Gagal menyimpan klien." };
  return { error: null, client: data as ClientRecord };
}

export async function updateClientRecord(id: string, input: ClientFormInput): Promise<{ error: string | null }> {
  const c = await ctx();
  if ("error" in c) return { error: c.error ?? "Terjadi kesalahan." };
  if (!input.name.trim()) return { error: "Nama klien wajib diisi." };
  const { error } = await c.supabase
    .from("clients")
    .update({
      name: input.name.trim(),
      email: input.email.trim() || null,
      phone: input.phone.trim() || null,
      address: input.address.trim() || null,
    })
    .eq("id", id);
  return { error: error ? "Gagal memperbarui klien." : null };
}

export async function deleteClientRecord(id: string): Promise<{ error: string | null }> {
  const c = await ctx();
  if ("error" in c) return { error: c.error ?? "Terjadi kesalahan." };
  const { error } = await c.supabase.from("clients").delete().eq("id", id);
  return { error: error ? "Gagal menghapus klien." : null };
}
