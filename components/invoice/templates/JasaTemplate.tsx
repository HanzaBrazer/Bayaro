import * as React from "react";
import { formatRupiah, formatDateID } from "@/lib/utils";
import { lineTotal, type InvoiceTotals } from "@/lib/invoice/calc";
import type { InvoiceFormValues, WorkspaceInfo } from "@/lib/invoice/types";

export interface JasaTemplateProps {
  workspace: WorkspaceInfo;
  values: InvoiceFormValues;
  totals: InvoiceTotals;
  /** Watermark halus untuk plan Free (placeholder; logika plan di Langkah 9). */
  watermark?: boolean;
}

/**
 * Template invoice "Jasa" — satu sumber untuk live preview & (nanti) PDF/PNG/link publik.
 * Nomor & nominal memakai IBM Plex Mono (font-mono) dengan figur tabular.
 */
export function JasaTemplate({ workspace, values, totals, watermark }: JasaTemplateProps) {
  const rows = values.items.filter((i) => i.description.trim() || i.unit_price > 0 || i.quantity > 0);

  return (
    <div id="invoice-doc" className="relative mx-auto w-full max-w-[794px] overflow-hidden bg-white p-8 text-ink md:p-10" style={{ fontSize: 13, lineHeight: 1.5 }}>
      {watermark && (
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rotate-[-30deg] select-none text-[90px] font-extrabold uppercase tracking-widest text-ink/[0.05]">
            Bayaro
          </span>
        </div>
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-6 border-b border-line pb-6">
        <div className="flex items-center gap-3">
          {workspace.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={workspace.logo_url} alt="Logo" className="h-12 w-12 rounded-lg object-contain" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-ink text-lg font-bold text-bone">
              {(workspace.name ?? "B").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-base font-bold text-ink">{workspace.name || "Usaha Saya"}</p>
            {workspace.address && <p className="max-w-[220px] text-xs text-muted">{workspace.address}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-tight text-ink">INVOICE</p>
          <p className="font-mono text-sm text-ink-soft tabular-nums">{values.number || "—"}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-6 py-6">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Ditagihkan kepada</p>
          <p className="font-semibold text-ink">{values.clientName || "—"}</p>
          {values.clientAddress && <p className="whitespace-pre-line text-xs text-muted">{values.clientAddress}</p>}
        </div>
        <div className="text-right">
          <div className="inline-grid grid-cols-[auto_auto] gap-x-3 gap-y-1 text-left">
            <span className="text-xs text-muted">Tanggal terbit</span>
            <span className="font-mono text-xs text-ink tabular-nums">
              {values.issueDate ? formatDateID(values.issueDate) : "—"}
            </span>
            <span className="text-xs text-muted">Jatuh tempo</span>
            <span className="font-mono text-xs text-ink tabular-nums">
              {values.dueDate ? formatDateID(values.dueDate) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Items */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
            <th className="py-2 text-left font-semibold">Deskripsi</th>
            <th className="py-2 text-right font-semibold">Qty</th>
            <th className="py-2 text-right font-semibold">Harga</th>
            <th className="py-2 text-right font-semibold">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-6 text-center text-sm text-muted">
                Belum ada item.
              </td>
            </tr>
          ) : (
            rows.map((it, idx) => (
              <tr key={idx} className="border-b border-line/70 align-top">
                <td className="py-2.5 pr-3 text-ink">{it.description || "—"}</td>
                <td className="py-2.5 text-right font-mono tabular-nums">{it.quantity || 0}</td>
                <td className="py-2.5 text-right font-mono tabular-nums">{formatRupiah(it.unit_price)}</td>
                <td className="py-2.5 text-right font-mono tabular-nums">{formatRupiah(lineTotal(it.quantity, it.unit_price))}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Summary */}
      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-[280px] space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span className="font-mono tabular-nums">Rp {formatRupiah(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted">Diskon</span>
              <span className="font-mono tabular-nums text-danger">− Rp {formatRupiah(totals.discount)}</span>
            </div>
          )}
          {totals.tax > 0 && (
            <div className="flex justify-between">
              <span className="text-muted">Pajak ({values.taxPercent}%)</span>
              <span className="font-mono tabular-nums">Rp {formatRupiah(totals.tax)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-line pt-2 text-base font-bold">
            <span>Total</span>
            <span className="font-mono tabular-nums text-primary">Rp {formatRupiah(totals.total)}</span>
          </div>
        </div>
      </div>

      {/* Notes & bank */}
      {(values.notes || workspace.bank_account) && (
        <div className="mt-8 grid grid-cols-2 gap-6 border-t border-line pt-6">
          <div>
            {values.notes && (
              <>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Catatan</p>
                <p className="whitespace-pre-line text-xs text-ink-soft">{values.notes}</p>
              </>
            )}
          </div>
          <div className="text-right">
            {workspace.bank_account && (
              <>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Pembayaran</p>
                <p className="font-mono text-xs text-ink tabular-nums">{workspace.bank_account}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
