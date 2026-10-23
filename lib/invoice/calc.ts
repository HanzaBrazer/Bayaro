import type { InvoiceItemInput } from "./types";

export function lineTotal(quantity: number, unitPrice: number): number {
  const q = Number.isFinite(quantity) ? quantity : 0;
  const p = Number.isFinite(unitPrice) ? unitPrice : 0;
  return Math.round(q * p);
}

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

/**
 * Hitungan: subtotal = Σ(qty×harga); dikurangi diskon (Rp);
 * pajak (%) dihitung dari nilai setelah diskon; total = setelah diskon + pajak.
 */
export function computeTotals(
  items: InvoiceItemInput[],
  taxPercent: number,
  discount: number
): InvoiceTotals {
  const subtotal = items.reduce((sum, it) => sum + lineTotal(it.quantity, it.unit_price), 0);
  const safeDiscount = Math.min(Math.max(0, discount || 0), subtotal);
  const afterDiscount = subtotal - safeDiscount;
  const tax = Math.round((afterDiscount * (taxPercent || 0)) / 100);
  const total = afterDiscount + tax;
  return { subtotal, discount: safeDiscount, tax, total };
}
