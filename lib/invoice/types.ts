export type ItemCategory = "barang" | "jasa" | "transportasi" | "lainnya";

export interface InvoiceItemInput {
  /** key sisi klien */
  key: string;
  description: string;
  quantity: number;
  unit_price: number;
  category: ItemCategory;
}

export interface InvoiceFormValues {
  clientId: string | null;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  number: string;
  issueDate: string; // yyyy-mm-dd
  dueDate: string | null; // yyyy-mm-dd
  items: InvoiceItemInput[];
  taxPercent: number;
  discount: number; // Rp
  notes: string;
  terms: string;
  templateId: string;
}

export interface WorkspaceInfo {
  id: string;
  name: string | null;
  logo_url: string | null;
  address: string | null;
  bank_account: string | null;
  invoice_prefix: string | null;
  next_invoice_number: number | null;
  // Identitas usaha lengkap (migrasi 0005)
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  signatory?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  account_holder?: string | null;
  terms?: string | null;
}

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  barang: "Barang",
  jasa: "Jasa",
  transportasi: "Transportasi",
  lainnya: "Lainnya",
};

export const CATEGORY_COLOR: Record<ItemCategory, string> = {
  barang: "#2E7D5B",
  jasa: "#1C1A17",
  transportasi: "#C9A227",
  lainnya: "#8B6FB0",
};
