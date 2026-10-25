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
  Share2,
  Pencil,
  Receipt,
  ShieldCheck,
  CircleDashed,
} from "lucide-react";
import { useToast } from "@/components/ui";
import { cn, formatRupiah, formatDateID } from "@/lib/utils";
import { downloadInvoicePdf, downloadInvoicePng } from "@/lib/export/clientExport";
import { PaymentClaimModal } from "./PaymentClaimModal";
import { PaymentReviewModal } from "./PaymentReviewModal";
import { ShareInvoiceModal } from "./ShareInvoiceModal";
import type { PendingProof } from "@/lib/payment/actions";

type Claim = "none" | "pending" | "rejected";

/** Ringkasan status di kepala panel: warna & teks mengikuti keadaan invoice. */
function statusTone(isPaid: boolean, claim: Claim) {
  if (isPaid)
    return {
      label: "Lunas",
      icon: CheckCircle2,
      wrap: "border-primary/25 bg-primary-soft",
      text: "text-primary",
    };
  if (claim === "pending")
    return {
      label: "Menunggu konfirmasi",
      icon: Clock,
      wrap: "border-warning/25 bg-warning-soft",
      text: "text-warning",
    };
  if (claim === "rejected")
    return {
      label: "Konfirmasi ditolak",
      icon: Clock,
      wrap: "border-danger/25 bg-danger-soft",
      text: "text-danger",
    };
  return {
    label: "Belum dibayar",
    icon: CircleDashed,
    wrap: "border-line bg-canvas",
    text: "text-muted",
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-0.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
      {children}
    </p>
  );
}

/**
 * Panel aksi di samping dokumen invoice publik.
 * Isinya menyesuaikan peran: penerima invoice hanya melihat unduhan &
 * konfirmasi pembayaran; pemilik invoice mendapat Bagikan, Edit, dan tinjau.
 */
export function PublicInvoiceActions({
  token,
  number,
  invoiceId,
  total,
  dueDate,
  isPaid,
  claimStatus,
  isOwner = false,
  pendingProof = null,
  businessName,
  clientName,
  clientEmail,
  clientPhone,
  emailEnabled = false,
  autoDownload,
}: {
  token: string;
  number: string;
  invoiceId: string;
  total: number;
  dueDate: string | null;
  isPaid: boolean;
  claimStatus: Claim;
  isOwner?: boolean;
  pendingProof?: PendingProof | null;
  businessName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  emailEnabled?: boolean;
  autoDownload?: "pdf" | "png" | null;
}) {
  const toast = useToast();
  const [busy, setBusy] = React.useState<null | "pdf" | "png">(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [claimOpen, setClaimOpen] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [claim, setClaim] = React.useState<Claim>(claimStatus);
  const [shareUrl, setShareUrl] = React.useState("");
  const didAuto = React.useRef(false);

  React.useEffect(() => {
    setShareUrl(`${window.location.origin}/i/${token}`);
  }, [token]);

  const safeName = (number || "invoice").replace(/[^\w.-]+/g, "-");
  const tone = statusTone(isPaid, claim);
  const ToneIcon = tone.icon;

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

  const ghost =
    "inline-flex h-10 w-full items-center justify-center gap-2 rounded-btn border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-canvas hover:border-ink/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60";
  const primary =
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-btn bg-primary px-4 text-sm font-semibold text-surface shadow-card transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
  const warn =
    "inline-flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-warning px-3 text-sm font-semibold text-surface transition-colors hover:bg-warning/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {/* Kepala: status + nominal */}
      <div className={cn("border-b px-4 py-4", tone.wrap)}>
        <div className={cn("flex items-center gap-1.5 text-xs font-semibold", tone.text)}>
          <ToneIcon className="h-3.5 w-3.5" />
          {tone.label}
        </div>
        <p className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-ink">
          Rp {formatRupiah(total)}
        </p>
        {dueDate && !isPaid && (
          <p className="mt-0.5 text-xs text-muted">Jatuh tempo {formatDateID(dueDate)}</p>
        )}
      </div>

      <div className="space-y-2 p-3">
        {/* Aksi utama penerima */}
        {!isPaid && claim !== "pending" && (
          <button type="button" onClick={() => setClaimOpen(true)} className={primary}>
            <Wallet className="h-4 w-4" />
            Saya sudah membayar
          </button>
        )}
        {claim === "pending" && !isPaid && (
          <p className="rounded-btn bg-canvas px-3 py-2 text-xs leading-relaxed text-muted">
            Bukti pembayaranmu sudah terkirim. Status berubah menjadi Lunas setelah
            diperiksa penerbit invoice.
          </p>
        )}

        <SectionLabel>Unduh</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => run("pdf")} disabled={busy !== null} className={ghost}>
            {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF
          </button>
          <button type="button" onClick={() => run("png")} disabled={busy !== null} className={ghost}>
            {busy === "png" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            PNG
          </button>
        </div>
        {err && <p className="text-xs text-danger">{err}</p>}

        {/* Khusus pemilik invoice */}
        {isOwner && (
          <>
            <div className="flex items-center gap-2 pt-2">
              <span className="h-px flex-1 bg-line" />
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                <ShieldCheck className="h-3 w-3" /> Pemilik
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>

            {pendingProof && (
              <button type="button" onClick={() => setReviewOpen(true)} className={warn}>
                <Receipt className="h-4 w-4" />
                Tinjau pembayaran
              </button>
            )}

            <button type="button" onClick={() => setShareOpen(true)} className={ghost}>
              <Share2 className="h-4 w-4" />
              Bagikan ke klien
            </button>

            <Link href={`/invoices/${invoiceId}/edit`} className={ghost}>
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
        onSubmitted={() => {
          setClaim("pending");
          toast.success("Konfirmasi terkirim", "Menunggu ditinjau penerbit invoice.");
        }}
      />

      <PaymentReviewModal proof={reviewOpen ? pendingProof : null} onClose={() => setReviewOpen(false)} />

      <ShareInvoiceModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        invoiceId={invoiceId}
        number={number}
        businessName={businessName}
        url={shareUrl}
        clientName={clientName}
        clientEmail={clientEmail}
        clientPhone={clientPhone}
        totalFormatted={`Rp ${formatRupiah(total)}`}
        emailEnabled={emailEnabled}
      />
    </div>
  );
}
