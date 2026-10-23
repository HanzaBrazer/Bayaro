import type { Plan } from "@/lib/plan/quota";

export const PRO_PRICE = 49000;
export const PRO_DAYS = 30;

export interface BillingTx {
  id: string;
  order_id: string | null;
  status: string;
  plan: string;
  created_at: string;
}

export interface BillingInfo {
  plan: Plan;
  currentPeriodEnd: string | null;
  price: number;
  history: BillingTx[];
}
