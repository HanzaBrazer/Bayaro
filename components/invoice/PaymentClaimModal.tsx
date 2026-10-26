"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Modal, Button, CurrencyInput, DatePicker, Textarea, FileUpload } from "@/components/ui";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { requestProofUpload, submitPaymentProof } from "@/lib/payment/actions";

const BUCKET = "payment-proofs";

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Modal "Saya sudah membayar" untuk penerima invoice (tanpa login).
 * Bukti wajib; file diunggah langsung ke bucket privat lewat signed URL.
 */
export function PaymentClaimModal({
  open,
  onClose,
  token,
  total,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  total: number;
  onSubmitted: () => void;
}) {
  const [file, setFile] = React.useState<File | null>(null);
  const [amount, setAmount] = React.useState<number | null>(total);
  const [paidAt, setPaidAt] = React.useState<Date | null>(new Date());
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setFile(null);
      setAmount(total);
      setPaidAt(new Date());
      setNote("");
      setError(null);
      setDone(false);
      setBusy(false);
    }
  }, [open, total]);

  async function submit() {
    if (busy) return;
    setError(null);
    if (!file) return setError("Bukti pembayaran wajib diunggah.");
    if (!amount || amount <= 0) return setError("Nominal pembayaran wajib diisi.");
    if (!paidAt) return setError("Tanggal pembayaran wajib diisi.");

    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const prep = await requestProofUpload(token, ext);
      if (prep.error || !prep.path || !prep.uploadToken) {
        return setError(prep.error ?? "Gagal menyiapkan unggahan.");
      }

      const sb = createBrowserSupabase();
      const { error: upErr } = await sb.storage
        .from(BUCKET)
        .uploadToSignedUrl(prep.path, prep.uploadToken, file);
      if (upErr) return setError(`Gagal mengunggah bukti: ${upErr.message}`);

      const res = await submitPaymentProof(token, {
        path: prep.path,
        amount,
        paidAt: toISO(paidAt),
        note,
      });
      if (res.error) return setError(res.error);

      setDone(true);
      onSubmitted();
    } catch {
      setError("Jaringan bermasalah. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={done ? "Konfirmasi terkirim" : "Konfirmasi pembayaran"}
      description={
        done
          ? undefined
          : "Unggah bukti transfer agar penerbit invoice dapat memverifikasi pembayaranmu."
      }
      footer={
        done ? (
          <Button onClick={onClose}>Tutup</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Batal
            </Button>
            <Button onClick={submit} loading={busy}>
              Kirim konfirmasi
            </Button>
          </>
        )
      }
    >
      {done ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <p className="text-sm text-ink">
            Terima kasih. Pembayaranmu akan ditinjau oleh penerbit invoice, dan status invoice
            berubah menjadi <span className="font-semibold">Lunas</span> setelah dikonfirmasi.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-input border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <FileUpload
            label="Bukti pembayaran"
            helper="Foto/tangkapan layar bukti transfer. JPG, PNG, atau WebP · maks 5 MB."
            accept="image/png,image/jpeg,image/webp"
            maxSizeMB={5}
            onFileSelect={setFile}
          />

          <CurrencyInput label="Nominal dibayar" value={amount} onValueChange={setAmount} />

          <DatePicker label="Tanggal pembayaran" value={paidAt} onChange={setPaidAt} />

          <Textarea
            label="Catatan (opsional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="mis. transfer dari rekening BCA a.n. ..."
          />
        </div>
      )}
    </Modal>
  );
}
