import type { SupabaseClient } from "@supabase/supabase-js";

export const FREE_DAILY_LIMIT = 10;

export type Plan = "free" | "pro";

export interface QuotaStatus {
  plan: Plan;
  used: number;
  limit: number | null; // null = tanpa batas (Pro)
  remaining: number | null;
}

/** Awal hari ini dalam zona WIB, sebagai ISO (mis. 2026-10-23T00:00:00+07:00). */
export function startOfTodayWIB(): string {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return `${ymd}T00:00:00+07:00`;
}

export async function getPlanFor(supabase: SupabaseClient, userId: string): Promise<Plan> {
  // Pro aktif = ADA langganan pro berstatus active yang belum kedaluwarsa
  // (bukan sekadar baris terakhir — order pending yang lebih baru tak membatalkan Pro).
  const { data } = await supabase
    .from("subscriptions")
    .select("current_period_end")
    .eq("user_id", userId)
    .eq("plan", "pro")
    .eq("status", "active")
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return "free";
  const notExpired = !data.current_period_end || new Date(data.current_period_end as string) > new Date();
  return notExpired ? "pro" : "free";
}

/** Jumlah invoice yang dibuat user hari ini (zona WIB) — real-time COUNT. */
export async function countTodayInvoices(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfTodayWIB());
  return count ?? 0;
}
