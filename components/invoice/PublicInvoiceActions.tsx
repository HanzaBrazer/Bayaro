"use client";

import * as React from "react";
import Link from "next/link";
import {
  Download,
  Image as ImageIcon,
  Loader2,
  Clock,
  CheckCircle2,
  Wallet,
  Link2,
  Pencil,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/components/ui";
import { downloadInvoicePdf, downloadInvoicePng } from "@/lib/export/clientExport";
import { PaymentClaimModal } from "./PaymentClaimModal";
import { PaymentReviewModal } from "./PaymentReviewModal";
import type { PendingProof } from "@/lib/payment/actions";

/**
 * Panel aksi di samping dokumen invoice publik.
 * Isinya menyesuaikan peran: penerima invoice hanya melihat unduhan &
 * konfirmasi pembayaran; pemilik invoice mendapat Bagikan link, Edit, dan
 * tinjau pembayaran.
 */
export function PublicInvoiceActions({
  token,
  number,
  invoiceId,
  total,
  isPaid,
  claimStatus,
  isOwner = false,
  pendingProof = null,
  autoDownload,
}: {
  token: string;
  number: string;
  invoiceId: string;
  total: number;
  isPaid: boolean;
  claimStatus: "none" | "pending" | "rejected";
  isOwner?: boolean;
  pendingProof?: PendingProof | null;
  autoDownload?: "pdf" | "png" | null;
}) {
  const toast = useToast();
  const [busy, setBusy] = React.useState<null | "pdf" | "png">(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [claimOpen, setClaimOpen] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [claim, setClaim] = React.useState(claimStatus);
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
    const t = setTimeout(() => run(autoDownload), 600);
    return () => clearTimeout(t);
  }, [autoDownload, run]);

  function shareLink() {
    const url = `${window.location.origin}/i/${token}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => toast.success("Link disalin", "Bagikan ke kliennya."))
      .catch(() => toast.error("Gagal menyalin", url));
  }

  const item =
    "inline-flex h-10 w-full items-center justify-center gap-2 rounded-btn border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60";
  const itemPrimary =
    "inline-flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-primary px-4 text-sm font-medium text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const itemWarning =
    "inline-flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-warning px-4 text-sm font-medium text-surface transition-colors hover:bg-warning/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <div className="space-y-3">
      {/* Status pembayaran */}
      {isPaid ? (
        <div className="flex items-start gap-2 rounded-card border border-primary/30 bg-primary-soft px-3 py-2.5 text-sm text-primary">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Invoice ini sudah <span className="font-semibold">Lunas</span>.
          </span>
        </div>
      ) : claim === "pending" ? (
        <div className="flex items-start gap-2 rounded-card border border-warning/30 bg-warning-soft px-3 py-2.5 text-sm text-warning">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Konfirmasi pembayaran menunggu ditinjau penerbit invoice.</span>
        </div>
      ) : claim === "rejected" ? (
        <div className="flex items-start gap-2 rounded-card border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Konfirmasi sebelumnya ditolak. Kirim ulang dengan bukti yang jelas.</span>
        </div>
      ) : null}

      {/* Aksi */}
      <div className="space-y-2 rounded-card border border-line bg-surface p-3 shadow-card">
        {!isPaid && claim !== "pending" && (
          <button type="button" onClick={() => setClaimOpen(true)} className={itemPrimary}>
            <Wallet className="h-4 w-4" />
            Saya sudah membayar
          </button>
        )}

        <button type="button" onClick={() => run("pdf")} disabled={busy !== null} className={item}>
          {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Unduh PDF
        </button>
        <button type="button" onClick={() => run("png")} disabled={busy !== null} className={item}>
          {busy === "png" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          Unduh PNG
        </button>

        {err && <p className="text-xs text-danger">{err}</p>}

        {/* Khusus pemilik invoice */}
        {isOwner && (
          <>
            <div className="flex items-center gap-2 pt-1">
              <span className="h-px flex-1 bg-line" />
              <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted">
                <ShieldCheck className="h-3 w-3" /> Pemilik
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>

            {pendingProof && (
              <button type="button" onClick={() => setReviewOpen(true)} className={itemWarning}>
                <Receipt className="h-4 w-4" />
                Tinjau pembayaran
              </button>
            )}

            <button type="button" onClick={shareLink} className={item}>
              <Link2 className="h-4 w-4" />
              Bagikan link
            </button>

            <Link href={`/invoices/${invoiceId}/edit`} className={item}>
              <Pencil className="h-4 w-4" />
              Edit invoice
            </Link>
          </>
        )}
      </div>

      <PaymentClaimModal
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        token={token}
        total={total}
        onSubmitted={() => setClaim("pending")}
      />

      <PaymentReviewModal
        proof={reviewOpen ? pendingProof : null}
        onClose={() => setReviewOpen(false)}
      />
    </div>
  );
}
