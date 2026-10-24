import { formatRupiah, formatDateID } from "@/lib/utils";
import { lineTotal } from "@/lib/invoice/calc";
import type { TemplateProps } from "./types";

/**
 * Template "Jasa" — layout khusus (header hijau + pita INVOICE vertikal),
 * mengikuti desain referensi. Seluruh teks memakai Plus Jakarta Sans (font-sans).
 * Skin Barang/Sewa/Kwitansi tetap memakai desain masing-masing.
 *
 * Ukuran mengikuti proporsi A4 (794px ≈ 595pt pada 96dpi).
 */

const GREEN = "#0F9676";
const DARK = "#2F3032";
const GRAY = "#EDEDED";

// Tata letak header (px, dari proporsi referensi)
const SIDEBAR_LEFT = 42;
const SIDEBAR_W = 136;
const SIDEBAR_H = 466;
const CONTENT_LEFT = 206; // kolom teks di kanan pita INVOICE
const CONTENT_RIGHT = 65;
const HEADER_H = 402;
const GUTTER = 42; // margin kiri/kanan tabel

export function JasaTemplate({ workspace, values, totals, watermark }: TemplateProps) {
  const rows = values.items.filter((i) => i.description.trim() || i.unit_price > 0 || i.quantity > 0);

  const bizName = workspace.name || "Usaha Saya";
  const terms = values.terms?.trim() || workspace.terms?.trim() || "";
  const signatory = workspace.signatory?.trim() || "";
  const projectName = values.projectName?.trim() || "";
  const notes = values.notes?.trim() || "";
  const rekening = [workspace.bank_name, workspace.account_number].filter((v) => v && v.trim()).join(" ");
  const money = (n: number) => `Rp ${formatRupiah(n)}`;
  const dash = (v?: string | null) => (v && v.trim() ? v : "—");

  const logo = workspace.logo_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={workspace.logo_url} alt="Logo" className="h-[43px] w-[43px] rounded-full bg-white object-contain" />
  ) : (
    <div
      className="flex h-[43px] w-[43px] items-center justify-center rounded-full bg-white text-[20px] font-extrabold"
      style={{ color: GREEN }}
    >
      {bizName.charAt(0).toUpperCase()}
    </div>
  );

  /** Satu baris kontak (dipakai blok "Dari" & "Ditagihkan Kepada"). */
  const party = (
    title: string,
    name: string,
    phone?: string | null,
    email?: string | null,
    address?: string | null,
    align: "left" | "right" = "left"
  ) => (
    <div style={{ textAlign: align }}>
      <p className="mb-[6px] text-[13px] font-bold text-white">{title}</p>
      <p className="text-[13px] leading-[1.6] text-white">{dash(name)}</p>
      {phone && <p className="text-[13px] leading-[1.6] text-white">{phone}</p>}
      {email && <p className="text-[13px] leading-[1.6] text-white">{email}</p>}
      {address && <p className="whitespace-pre-line text-[13px] leading-[1.6] text-white">{address}</p>}
    </div>
  );

  const infoCell = (label: string, align: "left" | "center" | "right" = "left") => (
    <div style={{ textAlign: align }}>
      <p className="text-[12px] font-bold text-white">{label}</p>
    </div>
  );

  return (
    <div
      id="invoice-doc"
      className="relative mx-auto w-full max-w-[794px] overflow-hidden bg-white font-sans"
      style={{ color: DARK, fontSize: 14 }}
    >
      {watermark && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="rotate-[-30deg] select-none text-[90px] font-extrabold uppercase tracking-widest text-black/[0.06]">
            Bayaro
          </span>
        </div>
      )}

      {/* ===== HEADER HIJAU ===== */}
      <div className="relative" style={{ background: GREEN, height: HEADER_H }}>
        {/* Identitas usaha */}
        <div
          className="absolute flex items-center gap-[17px]"
          style={{ left: CONTENT_LEFT, right: CONTENT_RIGHT, top: 31 }}
        >
          {logo}
          <div className="min-w-0">
            <p className="truncate text-[19px] font-extrabold uppercase leading-[1.15] tracking-wide text-white">
              {bizName}
            </p>
            {workspace.website && (
              <p className="truncate text-[14px] uppercase leading-[1.2] text-white/85">{workspace.website}</p>
            )}
          </div>
        </div>

        {/* Pita putih: Total Tagihan */}
        <div
          className="absolute flex items-center justify-between bg-white"
          style={{ left: 178, top: 101, width: 574, height: 41, paddingLeft: 28, paddingRight: 26 }}
        >
          <span className="text-[14px] font-bold">Total Tagihan</span>
          <span className="text-[14px] font-bold">{money(totals.total)}</span>
        </div>

        {/* Nama proyek + deskripsi (fallback ke Catatan bila proyek kosong) */}
        <div className="absolute" style={{ left: CONTENT_LEFT, right: CONTENT_RIGHT, top: 176 }}>
          <p className="mb-[6px] text-[13px] font-bold text-white">
            {projectName ? "Nama Proyek" : "Catatan"}
          </p>
          <p className="line-clamp-1 text-[13px] leading-[1.5] text-white">
            {projectName || notes || "—"}
          </p>
          {projectName && notes && (
            <p className="line-clamp-2 whitespace-pre-line text-[13px] leading-[1.5] text-white/85">{notes}</p>
          )}
        </div>

        {/* Dari / Ditagihkan kepada */}
        <div
          className="absolute flex items-start justify-between gap-6"
          style={{ left: CONTENT_LEFT, right: CONTENT_RIGHT, top: 256 }}
        >
          <div className="min-w-0 flex-1">
            {party("Dari", bizName, workspace.phone, workspace.email, workspace.address, "left")}
          </div>
          <div className="min-w-0 flex-1">
            {party(
              "Ditagihkan Kepada",
              values.clientName,
              values.clientPhone,
              values.clientEmail,
              values.clientAddress,
              "right"
            )}
          </div>
        </div>
      </div>

      {/* ===== PITA "INVOICE" VERTIKAL ===== */}
      <div
        className="absolute z-10 flex items-center justify-center"
        style={{ left: SIDEBAR_LEFT, top: 0, width: SIDEBAR_W, height: SIDEBAR_H, background: DARK }}
      >
        <span
          className="whitespace-nowrap text-[93px] font-extrabold leading-none tracking-tight text-white"
          style={{ transform: "rotate(-90deg)" }}
        >
          INVOICE
        </span>
      </div>

      {/* ===== NOMOR INVOICE + SYARAT (di samping pita) ===== */}
      <div
        className="flex items-start justify-between gap-6"
        style={{ paddingLeft: CONTENT_LEFT, paddingRight: CONTENT_RIGHT, paddingTop: 26, minHeight: 64 }}
      >
        <div className="min-w-0">
          <p className="text-[13px] font-bold">Nomor Invoice</p>
          <p className="text-[13px]">{values.number || "—"}</p>
        </div>
        <div className="min-w-0 max-w-[55%] text-right">
          <p className="text-[13px] font-bold">Syarat &amp; Ketentuan</p>
          <p className="line-clamp-2 whitespace-pre-line text-[13px]">{terms || "—"}</p>
        </div>
      </div>

      {/* ===== BAR INFO PEMBAYARAN & TANGGAL ===== */}
      <div style={{ paddingLeft: GUTTER, paddingRight: GUTTER, paddingTop: 22 }}>
        <div className="grid grid-cols-4 items-center" style={{ background: DARK, height: 41, paddingLeft: 20, paddingRight: 20 }}>
          {infoCell("No. Rekening")}
          {infoCell("Atas Nama", "center")}
          {infoCell("Tanggal Terbit", "center")}
          {infoCell("Jatuh Tempo", "right")}
        </div>
        <div className="grid grid-cols-4 items-center" style={{ background: GRAY, height: 41, paddingLeft: 20, paddingRight: 20 }}>
          <p className="text-[13px]">{dash(rekening)}</p>
          <p className="text-center text-[13px]">{dash(workspace.account_holder)}</p>
          <p className="text-center text-[13px]">{values.issueDate ? formatDateID(values.issueDate) : "—"}</p>
          <p className="text-right text-[13px]">{values.dueDate ? formatDateID(values.dueDate) : "—"}</p>
        </div>
      </div>

      {/* ===== TABEL ITEM ===== */}
      <div style={{ paddingLeft: GUTTER, paddingRight: GUTTER, paddingTop: 22 }}>
        <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col />
            <col style={{ width: 140 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 140 }} />
          </colgroup>
          <thead>
            <tr style={{ background: DARK }}>
              <th className="py-0 text-left text-[13px] font-bold text-white" style={{ height: 41, paddingLeft: 20 }}>Deskripsi</th>
              <th className="text-right text-[13px] font-bold text-white">Harga</th>
              <th className="text-center text-[13px] font-bold text-white">Qty</th>
              <th className="text-right text-[13px] font-bold text-white" style={{ paddingRight: 20 }}>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-[13px] text-black/50">Belum ada item.</td>
              </tr>
            ) : (
              rows.map((it, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? GRAY : "transparent" }}>
                  <td className="align-middle text-[13px]" style={{ height: 41, paddingLeft: 20, paddingRight: 12 }}>
                    {it.description || "—"}
                  </td>
                  <td className="text-right text-[13px]">{formatRupiah(it.unit_price)}</td>
                  <td className="text-center text-[13px]">{it.quantity || 0}</td>
                  <td className="text-right text-[13px]" style={{ paddingRight: 20 }}>
                    {formatRupiah(lineTotal(it.quantity, it.unit_price))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== TANDA TANGAN + RINGKASAN ===== */}
      <div className="flex items-end justify-between gap-6" style={{ paddingLeft: GUTTER + 20, paddingRight: GUTTER, paddingTop: 26 }}>
        {/* Tanda tangan */}
        <div className="pb-1">
          {signatory ? (
            <>
              <svg width="150" height="46" viewBox="0 0 150 46" fill="none" aria-hidden>
                <path
                  d="M3 38c22-3 36-9 45-18 4-4 6-9 2-11-5-3-13 2-17 8-4 7-3 15 3 18 7 4 17-1 26-9 7-6 13-13 18-20-6 12-9 22-7 27 2 4 7 4 12 1 4-2 8-6 12-10-2 5-2 8 1 9 4 2 9-1 14-5"
                  stroke={DARK}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <p className="text-[13px] font-bold">{signatory}</p>
              <p className="text-[13px]">Penanda Tangan</p>
            </>
          ) : null}
        </div>

        {/* Ringkasan */}
        <div style={{ width: 355 }}>
          <div className="flex items-center justify-between" style={{ background: GRAY, height: 41, paddingLeft: 22, paddingRight: 22 }}>
            <span className="text-[13px] font-bold">Subtotal</span>
            <span className="text-[13px]">{money(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex items-center justify-between" style={{ height: 38, paddingLeft: 22, paddingRight: 22 }}>
              <span className="text-[13px] font-bold">Diskon</span>
              <span className="text-[13px]">− {money(totals.discount)}</span>
            </div>
          )}
          {totals.tax > 0 && (
            <div className="flex items-center justify-between" style={{ height: 38, paddingLeft: 22, paddingRight: 22 }}>
              <span className="text-[13px] font-bold">Pajak ({values.taxPercent}%)</span>
              <span className="text-[13px]">{money(totals.tax)}</span>
            </div>
          )}
          <div className="flex items-center justify-between" style={{ background: GRAY, height: 41, paddingLeft: 22, paddingRight: 22 }}>
            <span className="text-[14px] font-bold">Total</span>
            <span className="text-[14px] font-bold">{money(totals.total)}</span>
          </div>
        </div>
      </div>

      {/* ===== FOOTER HIJAU ===== */}
      <div
        className="mt-[34px] flex items-center justify-between"
        style={{ background: GREEN, height: 85, paddingLeft: GUTTER + 20, paddingRight: CONTENT_RIGHT }}
      >
        <span className="text-[13px] font-bold text-white">{workspace.address || ""}</span>
        <span className="text-[13px] font-bold text-white">
          {workspace.website || workspace.email || workspace.phone || ""}
        </span>
      </div>
    </div>
  );
}
