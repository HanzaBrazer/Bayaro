import { computeTotals } from "@/lib/invoice/calc";
import type { InvoiceFormValues } from "@/lib/invoice/types";

/** Data invoice contoh untuk pratinjau template kustom. */
export const SAMPLE_VALUES: InvoiceFormValues = {
  clientId: null,
  projectName: "Rebranding Website",
  clientName: "PT Contoh Klien",
  clientAddress: "Jl. Merdeka No. 1, Jakarta",
  clientEmail: "halo@contohklien.com",
  clientPhone: "0812-3456-7890",
  number: "INV-0001",
  issueDate: "2026-10-31",
  dueDate: "2026-11-14",
  items: [
    { key: "1", description: "Desain identitas brand", quantity: 1, unit_price: 3500000, category: "jasa" },
    { key: "2", description: "Revisi tambahan", quantity: 2, unit_price: 500000, category: "jasa" },
    { key: "3", description: "Cetak kartu nama", quantity: 1, unit_price: 350000, category: "barang" },
  ],
  taxPercent: 11,
  discount: 0,
  notes: "Terima kasih atas kepercayaannya.",
  terms: "Pembayaran paling lambat 14 hari setelah invoice diterbitkan.",
  templateId: "jasa",
};

export const SAMPLE_TOTALS = computeTotals(SAMPLE_VALUES.items, SAMPLE_VALUES.taxPercent, SAMPLE_VALUES.discount);
