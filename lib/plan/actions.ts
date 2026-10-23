"use server";

import { createClient } from "@/lib/supabase/server";
import { getPlanFor, countTodayInvoices, FREE_DAILY_LIMIT, type QuotaStatus } from "./quota";

export async function getQuotaStatus(): Promise<QuotaStatus> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { plan: "free", used: 0, limit: FREE_DAILY_LIMIT, remaining: FREE_DAILY_LIMIT };

  const plan = await getPlanFor(supabase, user.id);
  const used = await countTodayInvoices(supabase, user.id);
  if (plan === "pro") return { plan, used, limit: null, remaining: null };
  return { plan, used, limit: FREE_DAILY_LIMIT, remaining: Math.max(0, FREE_DAILY_LIMIT - used) };
}
