"use client";

import * as React from "react";
import { Download, Image as ImageIcon, Loader2 } from "lucide-react";
import { BayaroMark } from "@/components/brand/Logo";
import { downloadInvoicePdf, downloadInvoicePng } from "@/lib/export/clientExport";

export function PublicInvoiceActions({
  number,
  autoDownload,
}: {
  token: string;
  number: string;
  autoDownload?: "pdf" | "png" | null;
}) {
  const [busy, setBusy] = React.useState<null | "pdf" | "png">(null);
  const [err, setErr] = React.useState<string | null>(null);
  const didAuto = React.useRef(false);

  const safeName = (number || "invoice").replace(/[^\w.-]+/g, "-");

  const run = React.useCallback(
    async (kind: "pdf" | "png") => {
      setErr(null);
      const el = document.getElementById("invoice-doc") as HTMLElement | null;
      if (!el) {
        setErr("Dokumen invoice belum siap. Muat ulang halaman.");
        return;
      }
      setBusy(kind);
      try {
        if (kind === "pdf") await downloadInvoicePdf(el, safeName);
        else await downloadInvoicePng(el, safeName);
      } catch {
        setErr(`Gagal membuat ${kind.toUpperCase()}. Coba lagi.`);
      } finally {
        setBusy(null);
      }
    },
    [safeName]
  );

  // Auto-unduh saat dibuka via ?dl=pdf|png (dari daftar invoice / editor).
  React.useEffect(() => {
    if (!autoDownload || didAuto.current) return;
    didAuto.current = true;
    // Tunggu sesaat agar font & gambar logo ter-render sebelum ditangkap.
    const t = setTimeout(() => run(autoDownload), 600);
    return () => clearTimeout(t);
  }, [autoDownload, run]);

  const btn =
    "inline-flex h-10 items-center gap-2 rounded-btn border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-card bg-ink text-bone">
          <BayaroMark className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs text-muted">Invoice</p>
          <p className="font-mono text-base font-semibold text-ink">{number}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex gap-2">
          <button type="button" onClick={() => run("pdf")} disabled={busy !== null} className={btn}>
            {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Unduh PDF
          </button>
          <button type="button" onClick={() => run("png")} disabled={busy !== null} className={btn}>
            {busy === "png" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            Unduh PNG
          </button>
        </div>
        {err && <p className="text-xs text-danger">{err}</p>}
      </div>
    </div>
  );
}
