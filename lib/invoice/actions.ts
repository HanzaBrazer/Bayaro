"use server";

import { createClient } from "@/lib/supabase/server";
import { computeTotals, lineTotal } from "./calc";
import type { InvoiceFormValues, WorkspaceInfo, ItemCategory, InvoiceItemInput } from "./types";

export type SaveResult = { error: string | null; id?: string };

function validate(values: InvoiceFormValues): string | null {
  if (!values.clientName.trim()) return "Nama klien wajib diisi.";
  const validItems = values.items.filter((i) => i.description.trim() && i.quantity > 0);
  if (validItems.length === 0) return "Minimal 1 item dengan deskripsi & qty.";
  const totals = computeTotals(values.items, values.taxPercent, values.discount);
  if (totals.total <= 0) return "Total harus lebih dari 0.";
  return null;
}

function itemRows(invoiceId: string, items: InvoiceItemInput[]) {
  return items
    .filter((i) => i.description.trim() || i.unit_price > 0)
    .map((it, idx) => ({
      invoice_id: invoiceId,
      description: it.description.trim(),
      quantity: it.quantity || 0,
      unit_price: it.unit_price || 0,
      subtotal: lineTotal(it.quantity, it.unit_price),
      category: it.category,
      position: idx,
    }));
}

async function context() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi." as string };
  const { data: ws } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!ws) return { error: "Workspace tidak ditemukan." as string };
  return { supabase, user, ws: ws as WorkspaceInfo };
}

export async function createInvoice(values: InvoiceFormValues, asDraft: boolean): Promise<SaveResult> {
  if (!asDraft) {
    const err = validate(values);
    if (err) return { error: err };
  }
  const ctx = await context();
  if ("error" in ctx) return { error: ctx.error ?? "Terjadi kesalahan." };
  const { supabase, user, ws } = ctx;

  // Tentukan nomor: auto (RPC atomik) bila sama dgn saran, atau manual.
  const suggestion = `${ws.invoice_prefix ?? "INV-"}${String(ws.next_invoice_number ?? 1).padStart(4, "0")}`;
  let number = values.number.trim();
  if (!number || number === suggestion) {
    const { data: allocated, error: rpcErr } = await supabase.rpc("allocate_invoice_number", {
      p_workspace: ws.id,
    });
    if (rpcErr || !allocated) return { error: "Gagal mengambil nomor invoice." };
    number = allocated as string;
  }

  const totals = computeTotals(values.items, values.taxPercent, values.discount);
  const { data: inv, error } = await supabase
    .from("invoices")
    .insert({
      workspace_id: ws.id,
      user_id: user.id,
      client_id: values.clientId || null,
      client_name: values.clientName.trim() || null,
      client_address: values.clientAddress.trim() || null,
      number,
      type: "jasa",
      template_id: values.templateId || "jasa",
      issue_date: values.issueDate,
      due_date: values.dueDate,
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total,
      status: "draft",
      notes: values.notes.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Nomor invoice sudah dipakai. Ganti nomornya." };
    return { error: "Gagal menyimpan invoice." };
  }

  const rows = itemRows(inv.id as string, values.items);
  if (rows.length > 0) {
    const { error: itemErr } = await supabase.from("invoice_items").insert(rows);
    if (itemErr) return { error: "Invoice tersimpan, tapi item gagal. Coba edit lagi." };
  }

  return { error: null, id: inv.id as string };
}

export async function updateInvoice(
  id: string,
  values: InvoiceFormValues,
  asDraft: boolean
): Promise<SaveResult> {
  if (!asDraft) {
    const err = validate(values);
    if (err) return { error: err };
  }
  const ctx = await context();
  if ("error" in ctx) return { error: ctx.error ?? "Terjadi kesalahan." };
  const { supabase } = ctx;

  const totals = computeTotals(values.items, values.taxPercent, values.discount);
  const { error } = await supabase
    .from("invoices")
    .update({
      client_id: values.clientId || null,
      client_name: values.clientName.trim() || null,
      client_address: values.clientAddress.trim() || null,
      number: values.number.trim(),
      template_id: values.templateId || "jasa",
      issue_date: values.issueDate,
      due_date: values.dueDate,
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total,
      notes: values.notes.trim() || null,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "Nomor invoice sudah dipakai. Ganti nomornya." };
    return { error: "Gagal memperbarui invoice." };
  }

  // Ganti item: hapus lalu tulis ulang (sederhana & konsisten).
  await supabase.from("invoice_items").delete().eq("invoice_id", id);
  const rows = itemRows(id, values.items);
  if (rows.length > 0) {
    await supabase.from("invoice_items").insert(rows);
  }

  return { error: null, id };
}

export interface InvoiceRow {
  id: string;
  number: string;
  client_name: string | null;
  issue_date: string;
  total: number;
  status: string;
  public_token: string | null;
}

export async function getInvoices(): Promise<InvoiceRow[]> {
  const ctx = await context();
  if ("error" in ctx) return [];
  const { supabase, ws } = ctx;
  const { data } = await supabase
    .from("invoices")
    .select("id,number,client_name,issue_date,total,status,public_token")
    .eq("workspace_id", ws.id)
    .order("created_at", { ascending: false });
  return (data ?? []) as InvoiceRow[];
}

export async function updateInvoiceStatus(id: string, status: string): Promise<{ error: string | null }> {
  const ctx = await context();
  if ("error" in ctx) return { error: ctx.error ?? "Terjadi kesalahan." };
  const { error } = await ctx.supabase.from("invoices").update({ status }).eq("id", id);
  return { error: error ? "Gagal mengubah status." : null };
}

export async function deleteInvoice(id: string): Promise<{ error: string | null }> {
  const ctx = await context();
  if ("error" in ctx) return { error: ctx.error ?? "Terjadi kesalahan." };
  const { error } = await ctx.supabase.from("invoices").delete().eq("id", id);
  return { error: error ? "Gagal menghapus invoice." : null };
}

export interface InvoiceForEdit {
  id: string;
  publicToken: string | null;
  values: InvoiceFormValues;
  workspace: WorkspaceInfo;
}

export async function getInvoiceForEdit(id: string): Promise<InvoiceForEdit | null> {
  const ctx = await context();
  if ("error" in ctx) return null;
  const { supabase, ws } = ctx;

  const { data: inv } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
  if (!inv) return null;

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("position", { ascending: true });

  const values: InvoiceFormValues = {
    clientId: inv.client_id ?? null,
    clientName: inv.client_name ?? "",
    clientAddress: inv.client_address ?? "",
    number: inv.number ?? "",
    issueDate: inv.issue_date ?? "",
    dueDate: inv.due_date ?? null,
    items: (items ?? []).map((it: Record<string, unknown>, idx: number) => ({
      key: `it-${idx}`,
      description: (it.description as string) ?? "",
      quantity: Number(it.quantity) || 0,
      unit_price: Number(it.unit_price) || 0,
      category: ((it.category as ItemCategory) ?? "lainnya"),
    })),
    taxPercent: inv.subtotal && inv.subtotal - inv.discount > 0 ? Math.round((Number(inv.tax) / (Number(inv.subtotal) - Number(inv.discount))) * 100) : 0,
    discount: Number(inv.discount) || 0,
    notes: inv.notes ?? "",
    templateId: inv.template_id ?? "jasa",
  };

  return { id: inv.id as string, publicToken: (inv.public_token as string) ?? null, values, workspace: ws };
}
