"use server";

import { createClient } from "@/lib/supabase/server";
import { getQuotaStatus } from "@/lib/plan/actions";
import type { DashboardData, DashInvoice, DashItem } from "./types";

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const empty: DashboardData = { invoices: [], items: [], quota: { plan: "free", used: 0, limit: 10, remaining: 10 } };
  if (!user) return empty;

  const { data: ws } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!ws) return empty;

  const { data: inv } = await supabase
    .from("invoices")
    .select("id,number,client_id,client_name,issue_date,total,status,created_at")
    .eq("workspace_id", ws.id)
    .order("created_at", { ascending: false });

  const { data: items } = await supabase
    .from("invoice_items")
    .select("category,subtotal,invoices!inner(issue_date,workspace_id)")
    .eq("invoices.workspace_id", ws.id);

  const quota = await getQuotaStatus();

  const invoices: DashInvoice[] = (inv ?? []).map((i: Record<string, unknown>) => ({
    id: i.id as string,
    number: (i.number as string) ?? "",
    clientId: (i.client_id as string) ?? null,
    clientName: (i.client_name as string) ?? null,
    issueDate: (i.issue_date as string) ?? "",
    total: Number(i.total) || 0,
    status: (i.status as string) ?? "draft",
    createdAt: (i.created_at as string) ?? "",
  }));

  const mappedItems: DashItem[] = (items ?? []).map((it: Record<string, unknown>) => {
    const parent = it.invoices as { issue_date?: string } | null;
    return {
      category: (it.category as string) ?? "lainnya",
      subtotal: Number(it.subtotal) || 0,
      issueDate: parent?.issue_date ?? "",
    };
  });

  return { invoices, items: mappedItems, quota };
}
