"use client";

import * as React from "react";
import { Check, Copy, Mail, MessageCircle, Send, Info } from "lucide-react";
import { Modal, Button, Input, useToast } from "@/components/ui";
import { sendInvoiceEmail } from "@/lib/share/actions";

/** Ubah nomor lokal (08xx) ke format internasional untuk wa.me. */
function toWaNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

/**
 * Bagikan invoice ke klien. Dirancang agar BISA DIPAKAI HARI INI:
 * WhatsApp & email memakai aplikasi milik pengguna. Bila RESEND_API_KEY
 * sudah diisi, email bisa dikirim langsung dari server.
 */
export function ShareInvoiceModal({
  open,
  onClose,
  invoiceId,
  number,
  businessName,
  url,
  clientName,
  clientEmail,
  clientPhone,
  totalFormatted,
  emailEnabled,
}: {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  number: string;
  businessName: string;
  url: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  totalFormatted: string;
  emailEnabled: boolean;
}) {
  const toast = useToast();
  const [email, setEmail] = React.useState(clientEmail);
  const [phone, setPhone] = React.useState(clientPhone);
  const [copied, setCopied] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setEmail(clientEmail);
      setPhone(clientPhone);
      setCopied(false);
      setSending(false);
    }
  }, [open, clientEmail, clientPhone]);

  const message = `Halo ${clientName || ""}, berikut invoice ${number} dari ${businessName}. Total ${totalFormatted}. Lihat & unduh di: ${url}`.replace(
    /\s+/g,
    " "
  );

  function copy() {
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Gagal menyalin", url));
  }

  function openWhatsApp() {
    const wa = toWaNumber(phone);
    const base = wa ? `https://wa.me/${wa}` : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  }

  function openMailApp() {
    const subject = `Invoice ${number} dari ${businessName}`;
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(message)}`;
  }

  async function sendFromServer() {
    if (sending) return;
    setSending(true);
    try {
      const res = await sendInvoiceEmail(invoiceId, email);
      if (res.error) return toast.error("Gagal mengirim", res.error);
      toast.success("Email terkirim", `Invoice dikirim ke ${email}.`);
      onClose();
    } catch {
      toast.error("Gagal mengirim", "Jaringan bermasalah. Coba lagi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Bagikan ke klien"
      description="Siapa pun yang punya tautan ini bisa melihat & mengunduh invoice."
      footer={<Button variant="secondary" onClick={onClose}>Tutup</Button>}
    >
      <div className="space-y-5">
        {/* Tautan */}
        <div className="space-y-1.5">
          <span className="block text-[13px] font-medium text-ink">Tautan invoice</span>
          <div className="flex gap-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="h-10 min-w-0 flex-1 rounded-input border border-line bg-canvas px-3 text-sm text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-btn border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              {copied ? "Tersalin" : "Salin"}
            </button>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="space-y-2 rounded-card border border-line p-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <span className="text-[13px] font-semibold text-ink">Kirim lewat WhatsApp</span>
          </div>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
            aria-label="Nomor WhatsApp klien"
          />
          <Button variant="secondary" onClick={openWhatsApp} className="w-full" leftIcon={<Send className="h-4 w-4" />}>
            Buka WhatsApp
          </Button>
        </div>

        {/* Email */}
        <div className="space-y-2 rounded-card border border-line p-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <span className="text-[13px] font-semibold text-ink">Kirim lewat email</span>
          </div>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@klien.com"
            aria-label="Email klien"
          />
          {emailEnabled ? (
            <div className="flex gap-2">
              <Button onClick={sendFromServer} loading={sending} className="flex-1" leftIcon={<Send className="h-4 w-4" />}>
                Kirim sekarang
              </Button>
              <Button variant="secondary" onClick={openMailApp} disabled={sending}>
                Aplikasi email
              </Button>
            </div>
          ) : (
            <>
              <Button variant="secondary" onClick={openMailApp} className="w-full" leftIcon={<Send className="h-4 w-4" />}>
                Buka aplikasi email
              </Button>
              <p className="flex items-start gap-1.5 text-xs text-muted">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Pesan akan dibuka di aplikasi email-mu. Agar Bayaro bisa mengirim sendiri
                atas nama usahamu, isi <span className="font-mono">RESEND_API_KEY</span> di server.
              </p>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
