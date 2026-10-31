import * as React from "react";
import { formatRupiah, formatDateID, cn } from "@/lib/utils";
import { lineTotal } from "@/lib/invoice/calc";
import { CATEGORY_LABEL, type ItemCategory } from "@/lib/invoice/types";
import { BLOCK_LABEL, type Block, type Layout, type LayoutSettings } from "@/lib/custom-template/schema";
import type { Letterhead } from "@/lib/custom-template/types";
import type { TemplateProps } from "./types";

/**
 * Renderer template kustom (builder blok).
 * Tata letak MENGALIR (CSS grid) — tidak ada posisi absolut untuk blok, sehingga
 * tak ada tumpang tindih dan ekspor PDF/PNG (#invoice-doc, A4 794px) tetap aman.
 * Satu-satunya elemen absolut: gambar kop surat sebagai latar halaman pertama.
 */

const A4_W = 794;
const A4_H = 1123;
const MARGIN = { S: 28, M: 40, L: 56 } as const;

/** Warna teks dikendalikan variabel CSS agar blok di atas pita gelap otomatis putih. */
const ON_LIGHT = { "--c-ink": "#1C1A17", "--c-muted": "#6B655B", "--c-line": "#E7E3DA" } as React.CSSProperties;
const ON_DARK = { "--c-ink": "#FFFFFF", "--c-muted": "rgba(255,255,255,0.78)", "--c-line": "rgba(255,255,255,0.28)" } as React.CSSProperties;

const ink = { color: "var(--c-ink)" };
const muted = { color: "var(--c-muted)" };

const shown = (flag: boolean | undefined) => flag !== false;
const alignCls = (a?: string) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");
const justifyCls = (a?: string) => (a === "right" ? "justify-end" : a === "center" ? "justify-center" : "justify-start");

type Ctx = TemplateProps & { settings: LayoutSettings; editing: boolean };

function Title({ children, show }: { children: React.ReactNode; show?: boolean }) {
  if (show === false) return null;
  return (
    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={muted}>
      {children}
    </p>
  );
}

function Placeholder({ type }: { type: Block["type"] }) {
  return (
    <p className="rounded border border-dashed px-2 py-1.5 text-[11px]" style={{ ...muted, borderColor: "var(--c-line)" }}>
      {BLOCK_LABEL[type]} — kosong pada invoice ini
    </p>
  );
}

function BlockView({ block, c }: { block: Block; c: Ctx }) {
  const { workspace: ws, values: v, totals: t, settings: s, editing } = c;
  const p = block.props ?? {};
  const f = p.fields ?? {};
  const num = s.numberStyle === "mono" ? "font-mono tabular-nums" : "tabular-nums";
  const money = (n: number) => `Rp ${formatRupiah(n)}`;
  const empty = () => (editing ? <Placeholder type={block.type} /> : null);

  switch (block.type) {
    case "logo": {
      const px = p.size === "S" ? 40 : p.size === "L" ? 72 : 56;
      const name = ws.name || "Usaha Saya";
      return (
        <div className={cn("flex", justifyCls(p.align))}>
          {ws.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ws.logo_url} alt="Logo" style={{ width: px, height: px }} className="rounded-lg object-contain" />
          ) : (
            <div
              className="flex items-center justify-center rounded-lg font-bold"
              style={{ width: px, height: px, background: s.accentColor, color: "#FFFFFF", fontSize: px * 0.4 }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      );
    }

    case "info_usaha":
      return (
        <div className={alignCls(p.align)}>
          <Title show={p.showTitle}>Dari</Title>
          <p className="font-semibold" style={ink}>{ws.name || "Usaha Saya"}</p>
          {shown(f.address) && ws.address && <p className="whitespace-pre-line text-[0.85em]" style={muted}>{ws.address}</p>}
          {shown(f.phone) && ws.phone && <p className="text-[0.85em]" style={muted}>{ws.phone}</p>}
          {shown(f.email) && ws.email && <p className="text-[0.85em]" style={muted}>{ws.email}</p>}
          {shown(f.website) && ws.website && <p className="text-[0.85em]" style={muted}>{ws.website}</p>}
        </div>
      );

    case "info_klien":
      return (
        <div className={alignCls(p.align)}>
          <Title show={p.showTitle}>Ditagihkan kepada</Title>
          <p className="font-semibold" style={ink}>{v.clientName || "—"}</p>
          {shown(f.address) && v.clientAddress && <p className="whitespace-pre-line text-[0.85em]" style={muted}>{v.clientAddress}</p>}
          {shown(f.phone) && v.clientPhone && <p className="text-[0.85em]" style={muted}>{v.clientPhone}</p>}
          {shown(f.email) && v.clientEmail && <p className="text-[0.85em]" style={muted}>{v.clientEmail}</p>}
        </div>
      );

    case "detail_invoice":
      return (
        <div className={alignCls(p.align)}>
          <p className="text-[1.9em] font-extrabold leading-none tracking-tight" style={{ color: "var(--c-title, var(--c-ink))" }}>
            {s.titleLabel}
          </p>
          {shown(f.number) && <p className={cn("mt-1.5", num)} style={ink}>{v.number || "—"}</p>}
          <div className="mt-1.5 space-y-0.5 text-[0.85em]">
            {shown(f.issueDate) && (
              <p style={muted}>
                Tanggal terbit: <span className={num} style={ink}>{v.issueDate ? formatDateID(v.issueDate) : "—"}</span>
              </p>
            )}
            {shown(f.dueDate) && (
              <p style={muted}>
                Jatuh tempo: <span className={num} style={ink}>{v.dueDate ? formatDateID(v.dueDate) : "—"}</span>
              </p>
            )}
          </div>
        </div>
      );

    case "nama_proyek":
      if (!v.projectName?.trim()) return empty();
      return (
        <div className={alignCls(p.align)}>
          <Title show={p.showTitle}>Nama proyek</Title>
          <p className="font-semibold" style={ink}>{v.projectName}</p>
        </div>
      );

    case "tabel_item": {
      const col = p.columns ?? {};
      const rows = v.items.filter((i) => i.description.trim() || i.unit_price > 0 || i.quantity > 0);
      const th = "py-2 text-[0.75em] font-semibold uppercase tracking-wide";
      return (
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: s.accentColor, color: "#FFFFFF" }}>
              {shown(col.no) && <th className={cn(th, "pl-3 text-left")}>No.</th>}
              <th className={cn(th, shown(col.no) ? "pl-2" : "pl-3", "text-left")}>Deskripsi</th>
              {shown(col.category) && <th className={cn(th, "text-left")}>Kategori</th>}
              {shown(col.qty) && <th className={cn(th, "text-right")}>Qty</th>}
              {shown(col.price) && <th className={cn(th, "text-right")}>Harga</th>}
              {shown(col.amount) && <th className={cn(th, "pr-3 text-right")}>Jumlah</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-5 text-center text-[0.85em]" style={muted}>Belum ada item.</td>
              </tr>
            ) : (
              rows.map((it, i) => (
                <tr key={i} className="border-b align-top" style={{ borderColor: "var(--c-line)" }}>
                  {shown(col.no) && <td className={cn("py-2 pl-3", num)} style={muted}>{String(i + 1).padStart(2, "0")}</td>}
                  <td className={cn("py-2 pr-2", shown(col.no) ? "pl-2" : "pl-3")} style={ink}>{it.description || "—"}</td>
                  {shown(col.category) && (
                    <td className="py-2 pr-2 text-[0.85em]" style={muted}>{CATEGORY_LABEL[it.category as ItemCategory] ?? "—"}</td>
                  )}
                  {shown(col.qty) && <td className={cn("py-2 text-right", num)} style={ink}>{it.quantity || 0}</td>}
                  {shown(col.price) && <td className={cn("py-2 text-right", num)} style={ink}>{formatRupiah(it.unit_price)}</td>}
                  {shown(col.amount) && (
                    <td className={cn("py-2 pr-3 text-right", num)} style={ink}>{formatRupiah(lineTotal(it.quantity, it.unit_price))}</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }

    case "ringkasan_total":
      return (
        <div className={cn("flex", p.align === "left" ? "justify-start" : p.align === "center" ? "justify-center" : "justify-end")}>
          <div className="w-full max-w-[280px] space-y-1">
            {shown(f.subtotal) && (
              <div className="flex justify-between"><span style={muted}>Subtotal</span><span className={num} style={ink}>{money(t.subtotal)}</span></div>
            )}
            {shown(f.discount) && t.discount > 0 && (
              <div className="flex justify-between"><span style={muted}>Diskon</span><span className={num} style={ink}>− {money(t.discount)}</span></div>
            )}
            {shown(f.tax) && t.tax > 0 && (
              <div className="flex justify-between"><span style={muted}>Pajak ({v.taxPercent}%)</span><span className={num} style={ink}>{money(t.tax)}</span></div>
            )}
            <div className="mt-1 flex items-center justify-between rounded-md px-3 py-2 font-bold" style={{ background: s.accentColor, color: "#FFFFFF" }}>
              <span>Total</span>
              <span className={num}>{money(t.total)}</span>
            </div>
          </div>
        </div>
      );

    case "info_pembayaran": {
      const rows = [
        shown(f.bank) && ws.bank_name ? { k: "Bank", v: ws.bank_name } : null,
        shown(f.accountNumber) && ws.account_number ? { k: "No. rekening", v: ws.account_number } : null,
        shown(f.accountHolder) && ws.account_holder ? { k: "Atas nama", v: ws.account_holder } : null,
      ].filter(Boolean) as { k: string; v: string }[];
      if (rows.length === 0 && !ws.bank_account) return empty();
      return (
        <div className={alignCls(p.align)}>
          <Title show={p.showTitle}>Info pembayaran</Title>
          {rows.length > 0 ? (
            rows.map((r) => (
              <p key={r.k} className="text-[0.85em]">
                <span style={muted}>{r.k}: </span>
                <span className={num} style={ink}>{r.v}</span>
              </p>
            ))
          ) : (
            <p className={cn("text-[0.85em]", num)} style={ink}>{ws.bank_account}</p>
          )}
        </div>
      );
    }

    case "catatan":
      if (!v.notes?.trim()) return empty();
      return (
        <div className={alignCls(p.align)}>
          <Title show={p.showTitle}>Catatan</Title>
          <p className="whitespace-pre-line text-[0.85em]" style={ink}>{v.notes}</p>
        </div>
      );

    case "syarat_ketentuan": {
      const terms = v.terms?.trim() || ws.terms?.trim() || "";
      if (!terms) return empty();
      return (
        <div className={alignCls(p.align)}>
          <Title show={p.showTitle}>Syarat &amp; ketentuan</Title>
          <p className="whitespace-pre-line text-[0.8em] leading-relaxed" style={muted}>{terms}</p>
        </div>
      );
    }

    case "tanda_tangan":
      return (
        <div className={cn("flex", justifyCls(p.align))}>
          <div className="w-44 text-center">
            <div className="h-12" />
            <div className="border-t pt-1" style={{ borderColor: "var(--c-line)" }}>
              <p className="text-[0.85em] font-semibold" style={ink}>{ws.signatory?.trim() || " "}</p>
              <p className="text-[0.7em] uppercase tracking-wide" style={muted}>Tanda tangan</p>
            </div>
          </div>
        </div>
      );

    case "footer": {
      const bits = [
        shown(f.phone) ? ws.phone : null,
        shown(f.email) ? ws.email : null,
        shown(f.website) ? ws.website : null,
      ].filter((x) => x && x.trim()) as string[];
      if (bits.length === 0 && !p.text?.trim()) return empty();
      return (
        <div className={cn("text-[0.8em]", alignCls(p.align))} style={muted}>
          {p.text?.trim() && <p className="mb-0.5 whitespace-pre-line" style={ink}>{p.text}</p>}
          {bits.length > 0 && <p>{bits.join("  ·  ")}</p>}
        </div>
      );
    }

    case "teks_bebas":
      // Dirender sebagai TEKS — bukan HTML. Tidak ada jalur injeksi markup.
      if (!p.text?.trim()) return empty();
      return <p className={cn("whitespace-pre-line text-[0.9em]", alignCls(p.align))} style={ink}>{p.text}</p>;

    case "pemisah":
      return <hr className="border-0 border-t" style={{ borderColor: "var(--c-line)" }} />;

    case "spasi":
      return <div aria-hidden style={{ height: p.size === "S" ? 12 : p.size === "L" ? 48 : 24 }} />;

    default:
      return null;
  }
}

function BlockShell({ block, c, onSelect, selectedId }: {
  block: Block;
  c: Ctx;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}) {
  const bg = block.props?.background;
  const style: React.CSSProperties =
    bg === "accent" ? { ...ON_DARK, background: c.settings.accentColor } : bg === "muted" ? { ...ON_LIGHT, background: "#F4F2EE" } : {};
  const padded = bg === "accent" || bg === "muted";
  const selected = selectedId === block.id;

  const inner = (
    <div className={cn(padded && "rounded-lg p-3")} style={style}>
      <BlockView block={block} c={c} />
    </div>
  );

  if (!onSelect) return inner;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(block.id);
        }
      }}
      aria-label={`Pilih blok ${BLOCK_LABEL[block.type]}`}
      aria-pressed={selected}
      className={cn(
        "-m-1 cursor-pointer rounded-md p-1 outline-none ring-offset-2 transition-shadow",
        selected ? "ring-2" : "hover:ring-1 focus-visible:ring-2"
      )}
      style={{ ["--tw-ring-color" as string]: c.settings.accentColor }}
    >
      {inner}
    </div>
  );
}

export function CustomTemplate({
  layout,
  letterhead,
  editing = false,
  selectedId = null,
  onSelect,
  ...props
}: TemplateProps & {
  layout: Layout;
  letterhead?: Letterhead | null;
  /** Mode builder: tampilkan placeholder untuk blok kosong & izinkan memilih blok. */
  editing?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const s = layout.settings;
  const margin = MARGIN[s.pageMargin];
  const padTop = letterhead ? Math.max(margin, letterhead.top) : margin;
  const padBottom = letterhead ? Math.max(margin, letterhead.bottom) : margin;
  const c: Ctx = { ...props, settings: s, editing };

  return (
    <div
      id="invoice-doc"
      className="relative mx-auto w-full overflow-hidden bg-white font-sans"
      style={{
        ...ON_LIGHT,
        maxWidth: A4_W,
        minHeight: letterhead ? A4_H : undefined,
        fontSize: s.baseFontSize,
        lineHeight: 1.5,
        ["--c-title" as string]: s.accentColor,
      }}
    >
      {letterhead && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={letterhead.url}
          alt=""
          aria-hidden
          crossOrigin="anonymous"
          className="pointer-events-none absolute left-0 top-0 w-full select-none"
          style={{ height: A4_H, objectFit: "cover", objectPosition: "top" }}
        />
      )}

      {props.watermark && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="rotate-[-30deg] select-none text-[90px] font-extrabold uppercase tracking-widest text-black/[0.05]">
            Bayaro
          </span>
        </div>
      )}

      <div className="relative z-10 flex flex-col gap-5" style={{ padding: `${padTop}px ${margin}px ${padBottom}px` }}>
        {layout.rows.map((row, ri) => {
          const isFirst = ri === 0;
          const isLast = ri === layout.rows.length - 1;
          const band = row.background === "accent" || row.background === "muted";
          const bandStyle: React.CSSProperties =
            row.background === "accent"
              ? { ...ON_DARK, background: s.accentColor, ["--c-title" as string]: "#FFFFFF" }
              : row.background === "muted"
              ? { ...ON_LIGHT, background: "#F4F2EE" }
              : {};
          return (
            <div
              key={row.id}
              className="grid gap-6"
              style={{
                gridTemplateColumns: `repeat(${row.columns}, minmax(0, 1fr))`,
                ...(band
                  ? {
                      // Pita selebar halaman; menempel ke tepi atas/bawah bila di baris pertama/terakhir.
                      marginLeft: -margin,
                      marginRight: -margin,
                      marginTop: isFirst && !letterhead ? -padTop : 0,
                      marginBottom: isLast && !letterhead ? -padBottom : 0,
                      padding: `${isFirst && !letterhead ? Math.max(28, padTop) : 20}px ${margin}px ${isLast && !letterhead ? Math.max(28, padBottom) : 20}px`,
                      ...bandStyle,
                    }
                  : {}),
              }}
            >
              {row.cells.map((cell, ci) => (
                <div key={ci} className="flex min-w-0 flex-col gap-3">
                  {cell.map((block) => (
                    <BlockShell key={block.id} block={block} c={c} onSelect={onSelect} selectedId={selectedId} />
                  ))}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
