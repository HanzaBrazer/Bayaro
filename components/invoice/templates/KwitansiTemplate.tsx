import * as React from "react";
import { formatRupiah, formatDateID, terbilang } from "@/lib/utils";
import type { TemplateProps } from "./types";

export function KwitansiTemplate({ workspace, values, totals, watermark }: TemplateProps) {
  const rincian =
    values.notes.trim() ||
    values.items
      .filter((i) => i.description.trim())
      .map((i) => i.description.trim())
      .join(", ") ||
    "—";

  return (
    <div id="invoice-doc" className="relative mx-auto w-full max-w-[794px] overflow-hidden bg-white p-8 text-ink md:p-10" style={{ fontSize: 14, lineHeight: 1.6 }}>
      {watermark && (
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rotate-[-30deg] select-none text-[90px] font-extrabold uppercase tracking-widest text-ink/[0.05]">Bayaro</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b-2 border-ink pb-4">
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
            <p className="text-base font-bold">{workspace.name || "Usaha Saya"}</p>
            {workspace.address && <p className="max-w-[260px] text-xs text-muted">{workspace.address}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-[0.2em] text-ink">KWITANSI</p>
          <p className="font-mono text-sm text-ink-soft tabular-nums">{values.number || "—"}</p>
        </div>
      </div>

      {/* Body */}
      <div className="mt-8 space-y-5">
        <div className="grid grid-cols-[150px_1fr] items-baseline gap-2">
          <span className="text-muted">Telah terima dari</span>
          <span className="border-b border-dashed border-line pb-1 font-semibold">{values.clientName || "—"}</span>
        </div>

        <div className="grid grid-cols-[150px_1fr] items-baseline gap-2">
          <span className="text-muted">Uang sejumlah</span>
          <span className="rounded-md bg-canvas px-3 py-2 text-sm italic text-ink-soft">{terbilang(totals.total)}</span>
        </div>

        <div className="grid grid-cols-[150px_1fr] items-baseline gap-2">
          <span className="text-muted">Untuk pembayaran</span>
          <span className="border-b border-dashed border-line pb-1 text-ink">{rincian}</span>
        </div>
      </div>

      {/* Nominal + tanda tangan */}
      <div className="mt-10 flex items-end justify-between">
        <div className="inline-flex items-center gap-2 rounded-lg border-2 border-ink px-4 py-2">
          <span className="text-lg font-bold">Rp</span>
          <span className="font-mono text-2xl font-bold tabular-nums">{formatRupiah(totals.total)}</span>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted">
            {values.issueDate ? formatDateID(values.issueDate) : "—"}
          </p>
          <div className="mt-14 border-t border-ink pt-1 text-sm font-medium">{workspace.name || "Penerima"}</div>
        </div>
      </div>
    </div>
  );
}
