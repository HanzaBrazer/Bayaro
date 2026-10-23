import type { QuotaStatus } from "@/lib/plan/quota";

export interface DashInvoice {
  id: string;
  number: string;
  clientId: string | null;
  clientName: string | null;
  issueDate: string; // yyyy-mm-dd
  total: number;
  status: string;
  createdAt: string;
}

export interface DashItem {
  category: string;
  subtotal: number;
  issueDate: string; // issue_date invoice terkait
}

export interface DashboardData {
  invoices: DashInvoice[];
  items: DashItem[];
  quota: QuotaStatus;
}
