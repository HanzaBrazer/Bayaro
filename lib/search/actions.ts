"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace/active";
import type { SearchResults } from "./types";

const EMPTY: SearchResults = { invoices: [], clients: [] };
const LIMIT = 6;

/**
 * Bersihkan input agar aman dipakai di filter `or()` PostgREST.
 * Koma & tanda kurung adalah pemisah sintaks di sana, jadi harus dibuang —
 * kalau tidak, mengetik koma akan membuat query gagal.
 */
function sanitize(q: string): string {
  return q.replace(/[,()*]/g, " ").trim();
}

/** Cari invoice & klien milik workspace user yang login. */
export async function searchEverything(rawQuery: string): Promise<SearchResults> {
  const q = sanitize(rawQuery);
  if (q.length < 2) return EMPTY;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  const activeId = await getActiveWorkspaceId(supabase, user.id);
  const ws = activeId ? { id: activeId } : null;
  if (!ws?.id) return EMPTY;

  const like = `%${q}%`;

  const [invRes, cliRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("id,number,client_name,total,status")
      .eq("workspace_id", ws.id)
      .or(`number.ilike.${like},client_name.ilike.${like}`)
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("clients")
      .select("id,name,email")
      .eq("workspace_id", ws.id)
      .or(`name.ilike.${like},email.ilike.${like}`)
      .order("name", { ascending: true })
      .limit(LIMIT),
  ]);

  return {
    invoices: (invRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      number: (r.number as string) ?? "—",
      clientName: (r.client_name as string) ?? null,
      total: Number(r.total) || 0,
      status: (r.status as string) ?? "draft",
    })),
    clients: (cliRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      name: (r.name as string) ?? "—",
      email: (r.email as string) ?? null,
    })),
  };
}
