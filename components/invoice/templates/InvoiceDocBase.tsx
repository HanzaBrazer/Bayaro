import * as React from "react";
import { formatRupiah, formatDateID, cn } from "@/lib/utils";
import { lineTotal } from "@/lib/invoice/calc";
import type { TemplateProps } from "./types";

type Variant = "jasa" | "barang" | "sewa";

/** Skema warna per skin. */
const THEME: Record<
  Variant,
  { accent: string; accentText: string; headHex: string; headText: string; totalBg: string; totalText: string }
> = {
  // Jasa: hijau primary, bersih.
  jasa: { accent: "#2E7D5B", accentText: "#2E7D5B", headHex: "#F4EFE4", headText: "#1C1A17", totalBg: "#2E7D5B", totalText: "#FFFFFF" },
  // Barang: header gelap + aksen emas (seperti referensi 1).
  barang: { accent: "#C9A227", accentText: "#1C1A17", headHex: "#1C1A17", headText: "#F4EFE4", totalBg: "#C9A227", totalText: "#1C1A17" },
  // Sewa: aksen emas.
  sewa: { accent: "#C9A227", accentText: "#9A7B1E", headHex: "#C9A227", headText: "#1C1A17", totalBg: "#1C1A17", totalText: "#FFFFFF" },
};

function Label({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: color ?? "#6B655B" }}>
      {children}
    </p>
  );
}

/**
 * Basis dokumen invoice lengkap (Jasa/Barang/Sewa): Invoice From/To, tabel item,
 * Payment Info, Subtotal/Diskon/Pajak/Total, Syarat & ketentuan, Authorised Sign,
 * dan footer kontak. Struktur sama, tampilan beda per skin. IBM Plex Mono untuk nominal.
 */
export function InvoiceDocBase({
  workspace,
  values,
  totals,
  watermark,
  variant,
}: TemplateProps & { variant: Variant }) {
  const t = THEME[variant];
  const rows = values.items.filter((i) => i.description.trim() || i.unit_price > 0 || i.quantity > 0);

  const bizName = workspace.name || "Usaha Saya";
  const terms = values.terms?.trim() || workspace.terms?.trim() || "";
  const signatory = workspace.signatory?.trim() || "";

  // Payment info terstruktur, fallback ke bank_account lama.
  const payRows = [
    workspace.bank_name ? { k: "Bank", v: workspace.bank_name } : null,
    workspace.account_number ? { k: "No. Rekening", v: workspace.account_number } : null,
    workspace.account_holder ? { k: "Atas Nama", v: workspace.account_holder } : null,
  ].filter(Boolean) as { k: string; v: string }[];
  const hasPayment = payRows.length > 0 || !!workspace.bank_account;

  const footerBits = [workspace.phone, workspace.email, workspace.website].filter((x) => x && x.trim()) as string[];

  const logoBox = (dark: boolean) =>
    workspace.logo_url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={workspace.logo_url} alt="Logo" className={cn("h-12 w-12 rounded-lg object-contain", dark && "bg-white/10")} />
    ) : (
      <div
        className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold"
        style={dark ? { background: "rgba(244,239,228,0.15)", color: "#F4EFE4" } : { background: "#1C1A17", color: "#F4EFE4" }}
      >
        {bizName.charAt(0).toUpperCase()}
      </div>
    );

  const contactLine = (addr?: string | null, phone?: string | null, email?: string | null) => (
    <>
      {addr && <p className="whitespace-pre-line text-xs text-muted">{addr}</p>}
      {phone && <p className="text-xs text-muted">Telp: {phone}</p>}
      {email && <p className="text-xs text-muted">{email}</p>}
    </>
  );

  return (
    <div id="invoice-doc" className="relative mx-auto w-full max-w-[794px] overflow-hidden bg-white text-ink" style={{ fontSize: 13, lineHeight: 1.5 }}>
      {watermark && (
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rotate-[-30deg] select-none text-[90px] font-extrabold uppercase tracking-widest text-ink/[0.05]">Bayaro</span>
        </div>
      )}

      {/* HEADER */}
      {variant === "barang" ? (
        <div className="flex items-center justify-between gap-4 px-8 py-6 md:px-10" style={{ background: "#1C1A17", color: "#F4EFE4" }}>
          <div className="flex items-center gap-3">
            {logoBox(true)}
            <div>
              <p className="text-base font-bold">{bizName}</p>
              {workspace.address && <p className="max-w-[240px] text-xs" style={{ color: "rgba(244,239,228,0.7)" }}>{workspace.address}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight">INVOICE</p>
            <p className="font-mono text-sm tabular-nums" style={{ color: "rgba(244,239,228,0.8)" }}>{values.number || "—"}</p>
          </div>
        </div>
      ) : (
        <div className={cn("flex items-start justify-between gap-6 px-8 pt-8 md:px-10", variant === "sewa" && "border-l-4 pl-7 md:pl-9")} style={variant === "sewa" ? { borderColor: t.accent } : undefined}>
          <div className="flex items-center gap-3">
            {logoBox(false)}
            <div>
              <p className="text-base font-bold text-ink">{bizName}</p>
              {workspace.address && <p className="max-w-[220px] text-xs text-muted">{workspace.address}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight" style={{ color: t.accentText }}>INVOICE</p>
            <p className="font-mono text-sm text-ink-soft tabular-nums">{values.number || "—"}</p>
          </div>
        </div>
      )}

      <div className="px-8 pb-8 pt-6 md:px-10">
        {/* Meta tanggal */}
        <div className="mb-5 flex flex-wrap justify-end gap-x-6 gap-y-1 border-b border-line pb-4 text-xs">
          <span className="text-muted">Tanggal terbit: <span className="font-mono text-ink tabular-nums">{values.issueDate ? formatDateID(values.issueDate) : "—"}</span></span>
          <span className="text-muted">Jatuh tempo: <span className="font-mono text-ink tabular-nums">{values.dueDate ? formatDateID(values.dueDate) : "—"}</span></span>
        </div>

        {/* FROM / TO */}
        <div className="grid grid-cols-2 gap-6 pb-6">
          <div>
            <Label color={t.accentText}>Ditagihkan kepada</Label>
            <p className="font-semibold text-ink">{values.clientName || "—"}</p>
            {contactLine(values.clientAddress, values.clientPhone, values.clientEmail)}
          </div>
          <div className="text-right">
            <Label color={t.accentText}>Dari</Label>
            <p className="font-semibold text-ink">{bizName}</p>
            {contactLine(workspace.address, workspace.phone, workspace.email)}
          </div>
        </div>

        {/* ITEM TABLE */}
        <table className="w-full border-collapse overflow-hidden rounded-lg">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide" style={{ background: t.headHex, color: t.headText }}>
              <th className="rounded-l-lg py-2.5 pl-3 text-left font-semibold">No.</th>
              <th className="py-2.5 text-left font-semibold">Deskripsi</th>
              <th className="py-2.5 text-right font-semibold">Harga</th>
              <th className="py-2.5 text-right font-semibold">Qty</th>
              <th className="rounded-r-lg py-2.5 pr-3 text-right font-semibold">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="py-6 text-center text-sm text-muted">Belum ada item.</td></tr>
            ) : (
              rows.map((it, idx) => (
                <tr key={idx} className="border-b border-line/70 align-top">
                  <td className="py-2.5 pl-3 font-mono text-ink-soft tabular-nums">{String(idx + 1).padStart(2, "0")}</td>
                  <td className="py-2.5 pr-3 text-ink">{it.description || "—"}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{formatRupiah(it.unit_price)}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{it.quantity || 0}</td>
                  <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{formatRupiah(lineTotal(it.quantity, it.unit_price))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAYMENT INFO + TOTALS */}
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div className="sm:max-w-[260px]">
            {hasPayment && (
              <>
                <Label color={t.accentText}>Info Pembayaran</Label>
                {payRows.length > 0 ? (
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
                    {payRows.map((p) => (
                      <React.Fragment key={p.k}>
                        <span className="text-muted">{p.k}</span>
                        <span className="font-mono text-ink tabular-nums">{p.v}</span>
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-ink tabular-nums">{workspace.bank_account}</p>
                )}
              </>
            )}
          </div>

          <div className="w-full sm:max-w-[280px]">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="font-mono tabular-nums">Rp {formatRupiah(totals.subtotal)}</span></div>
              {totals.discount > 0 && (
                <div className="flex justify-between"><span className="text-muted">Diskon</span><span className="font-mono tabular-nums text-danger">− Rp {formatRupiah(totals.discount)}</span></div>
              )}
              {totals.tax > 0 && (
                <div className="flex justify-between"><span className="text-muted">Pajak ({values.taxPercent}%)</span><span className="font-mono tabular-nums">Rp {formatRupiah(totals.tax)}</span></div>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg px-3 py-2 text-base font-bold" style={{ background: t.totalBg, color: t.totalText }}>
              <span>Total</span>
              <span className="font-mono tabular-nums">Rp {formatRupiah(totals.total)}</span>
            </div>
          </div>
        </div>

        {/* CATATAN + TTD */}
        {(values.notes || signatory) && (
          <div className="mt-8 flex items-end justify-between gap-6">
            <div className="max-w-[60%]">
              {values.notes && (
                <>
                  <Label color={t.accentText}>Catatan</Label>
                  <p className="whitespace-pre-line text-xs text-ink-soft">{values.notes}</p>
                </>
              )}
            </div>
            <div className="text-center">
              <div className="h-10" />
              <div className="w-44 border-t border-line pt-1">
                <p className="text-xs font-semibold text-ink">{signatory || " "}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted">Authorised Sign</p>
              </div>
            </div>
          </div>
        )}

        {/* TERMS */}
        {terms && (
          <div className="mt-8 border-t border-line pt-4">
            <Label color={t.accentText}>Syarat &amp; Ketentuan</Label>
            <p className="whitespace-pre-line text-[11px] leading-relaxed text-muted">{terms}</p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      {footerBits.length > 0 &&
        (variant === "barang" ? (
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 px-8 py-4 text-xs md:px-10" style={{ background: "#1C1A17", color: "rgba(244,239,228,0.85)" }}>
            {footerBits.map((b, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span style={{ color: t.accent }}>•</span>}
                {b}
              </span>
            ))}
          </div>
        ) : (
          <div className="mx-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t py-4 text-xs text-muted md:mx-10" style={{ borderColor: t.accent }}>
            {footerBits.map((b, i) => (
              <span key={i} className="flex items-center gap-4">
                {i > 0 && <span className="text-line">|</span>}
                {b}
              </span>
            ))}
          </div>
        ))}
    </div>
  );
}
