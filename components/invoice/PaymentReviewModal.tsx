"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Modal, Button, useToast } from "@/components/ui";
import { formatRupiah, formatDateID } from "@/lib/utils";
import { confirmProof, rejectProof, type PendingProof } from "@/lib/payment/actions";

/**
 * Modal owner untuk meninjau bukti pembayaran yang dikirim klien.
 * Gambar ditampilkan lewat signed URL berumur pendek (bucket privat).
 */
export function PaymentReviewModal({
  proof,
  onClose,
}: {
  proof: PendingProof | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = React.useState<null | "accept" | "reject">(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (proof) setError(null);
  }, [proof]);

  async function act(kind: "accept" | "reject") {
    if (!proof || busy) return;
    setBusy(kind);
    setError(null);
    try {
      const res = kind === "accept" ? await confirmProof(proof.id) : await rejectProof(proof.id);
      if (res.error) return setError(res.error);
      toast.success(kind === "accept" ? "Pembayaran dikonfirmasi" : "Konfirmasi ditolak",
        kind === "accept" ? `${proof.number} ditandai Lunas.` : "Klien bisa mengirim ulang bukti.");
      onClose();
      router.refresh();
    } catch {
      setError("Jaringan bermasalah. Coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal
      open={proof !== null}
      onClose={onClose}
      size="md"
      title="Tinjau pembayaran"
      description={proof ? `${proof.number} · ${proof.clientName ?? "—"}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy !== null}>Tutup</Button>
          <Button
            variant="primary"
            className="bg-danger hover:bg-danger/90"
            loading={busy === "reject"}
            disabled={busy === "accept"}
            onClick={() => act("reject")}
          >
            Tolak
          </Button>
          <Button loading={busy === "accept"} disabled={busy === "reject"} onClick={() => act("accept")}>
            Konfirmasi lunas
          </Button>
        </>
      }
    >
      {proof && (
        <div className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-input border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <dl className="grid grid-cols-2 gap-3 rounded-btn bg-canvas p-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Nominal dibayar</dt>
              <dd className="font-mono font-semibold text-ink">
                {proof.amount === null ? "—" : `Rp ${formatRupiah(proof.amount)}`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Tanggal pembayaran</dt>
              <dd className="font-mono text-ink">{proof.paidAt ? formatDateID(proof.paidAt) : "—"}</dd>
            </div>
            {proof.note && (
              <div className="col-span-2">
                <dt className="text-xs text-muted">Catatan klien</dt>
                <dd className="whitespace-pre-line text-ink">{proof.note}</dd>
              </div>
            )}
          </dl>

          <div>
            <p className="mb-1.5 text-[13px] font-medium text-ink">Bukti pembayaran</p>
            {proof.imageUrl ? (
              <a href={proof.imageUrl} target="_blank" rel="noopener" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={proof.imageUrl}
                  alt={`Bukti pembayaran ${proof.number}`}
                  className="max-h-[320px] w-full rounded-card border border-line bg-canvas object-contain"
                />
              </a>
            ) : (
              <p className="rounded-btn bg-canvas p-3 text-sm text-muted">Bukti tidak dapat dimuat.</p>
            )}
            <p className="mt-1 text-xs text-muted">Klik gambar untuk membuka ukuran penuh.</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
