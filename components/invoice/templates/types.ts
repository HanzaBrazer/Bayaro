import type { InvoiceFormValues, WorkspaceInfo } from "@/lib/invoice/types";
import type { InvoiceTotals } from "@/lib/invoice/calc";

export interface TemplateProps {
  workspace: WorkspaceInfo;
  values: InvoiceFormValues;
  totals: InvoiceTotals;
  /** Watermark halus untuk plan Free (logika plan di Langkah 9). */
  watermark?: boolean;
}
