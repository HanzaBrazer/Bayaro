"use client";

import * as React from "react";
import {
  Check,
  Copy,
  Globe,
  Mail,
  MessageCircle,
  Info,
  RotateCw,
  Link2Off,
  Link2,
  AlertCircle,
} from "lucide-react";
import { Modal, Button, Input, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  inviteByEmail,
  resendInvite,
  setLinkActive,
  type InviteRow,
} from "@/lib/share/actions";

/** Ubah nomor lokal (08xx) ke format internasional untuk wa.me. */
function toWaNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

/** Baris akses: label peran SELALU teks biasa — tidak ada pengaturan peran. */
function AccessRow({
  avatar,
  title,
  subtitle,
  action,
}: {
  avatar: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      {avatar}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink">{title}</p>
        {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
      </div>
      <span className="shrink-0 text-xs text-muted">Dapat melihat</span>
      {action}
    </li>
  );
}

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
  linkActive: initialLinkActive,
  invites: initialInvites,
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
  linkActive: boolean;
  invites: InviteRow[];
}) {
  const toast = useToast();
  const [emails, setEmails] = React.useState("");
  const [phone, setPhone] = React.useState(clientPhone);
  const [copied, setCopied] = React.useState(false);
  const [inviting, setInviting] = React.useState(false);
  const [resendingId, setResendingId] = React.useState<string | null>(null);
  const [togglingLink, setTogglingLink] = React.useState(false);
  const [confirmOff, setConfirmOff] = React.useState(false);
  const [rows, setRows] = React.useState<InviteRow[]>(initialInvites);
  const [linkActive, setLinkActiveState] = React.useState(initialLinkActive);
  const [failed, setFailed] = React.useState<{ email: string; reason: string }[]>([]);

  React.useEffect(() => {
    if (open) {
      setEmails(clientEmail ? clientEmail : "");
      setPhone(clientPhone);
      setCopied(false);
      setFailed([]);
      setRows(initialInvites);
      setLinkActiveState(initialLinkActive);
      setConfirmOff(false);
    }
  }, [open, clientEmail, clientPhone, initialInvites, initialLinkActive]);

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
    const first = emails.split(",")[0]?.trim() ?? "";
    const subject = `Invoice ${number} dari ${businessName}`;
    window.location.href = `mailto:${encodeURIComponent(first)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(message)}`;
  }

  async function invite() {
    if (inviting) return;
    const list = emails.split(",").map((e) => e.trim()).filter(Boolean);
    if (list.length === 0) return toast.error("Belum ada alamat", "Isi minimal satu email.");

    setInviting(true);
    setFailed([]);
    try {
      const res = await inviteByEmail(invoiceId, list);
      if (res.error) return toast.error("Gagal mengundang", res.error);

      if (res.sent.length > 0) {
        toast.success(
          `Undangan terkirim ke ${res.sent.length} alamat`,
          res.sent.join(", ")
        );
        const now = new Date().toISOString();
        setRows((prev) => {
          const next = [...prev];
          for (const e of res.sent) {
            const i = next.findIndex((r) => r.email.toLowerCase() === e.toLowerCase());
            if (i >= 0) next[i] = { ...next[i], lastSentAt: now, sendCount: next[i].sendCount + 1 };
            else next.push({ id: `tmp-${e}`, email: e, lastSentAt: now, sendCount: 1 });
          }
          return next;
        });
        setEmails("");
      }
      if (res.failed.length > 0) setFailed(res.failed);
    } catch {
      toast.error("Gagal mengundang", "Jaringan bermasalah. Coba lagi.");
    } finally {
      setInviting(false);
    }
  }

  async function resend(row: InviteRow) {
    if (resendingId) return;
    if (row.id.startsWith("tmp-")) return toast.info("Baru saja terkirim", "Muat ulang untuk mengirim ulang.");
    setResendingId(row.id);
    try {
      const res = await resendInvite(row.id);
      if (res.error) return toast.error("Gagal mengirim ulang", res.error);
      toast.success("Undangan dikirim ulang", row.email);
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, lastSentAt: new Date().toISOString(), sendCount: r.sendCount + 1 } : r
        )
      );
    } catch {
      toast.error("Gagal mengirim ulang", "Jaringan bermasalah. Coba lagi.");
    } finally {
      setResendingId(null);
    }
  }

  async function toggleLink(active: boolean) {
    if (togglingLink) return;
    setTogglingLink(true);
    try {
      const res = await setLinkActive(invoiceId, active);
      if (res.error) return toast.error("Gagal", res.error);
      setLinkActiveState(active);
      setConfirmOff(false);
      toast.success(
        active ? "Tautan diaktifkan" : "Tautan dinonaktifkan",
        active ? "Invoice bisa dibuka lagi." : "Tautan lama tidak bisa dibuka siapa pun."
      );
    } catch {
      toast.error("Gagal", "Jaringan bermasalah. Coba lagi.");
    } finally {
      setTogglingLink(false);
    }
  }

  const ghostSm =
    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-btn px-2 text-xs font-medium text-ink-soft transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Bagikan & undang"
      description="Orang yang diundang hanya dapat melihat invoice dan mengirim konfirmasi pembayaran."
      footer={<Button variant="secondary" onClick={onClose}>Tutup</Button>}
    >
      <div className="space-y-5">
        {/* 1. Tautan */}
        <div className="space-y-1.5">
          <span className="block text-[13px] font-medium text-ink">Tautan invoice</span>
          <div className="flex gap-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Tautan invoice"
              className={cn(
                "h-10 min-w-0 flex-1 rounded-input border border-line bg-canvas px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                linkActive ? "text-ink-soft" : "text-muted line-through"
              )}
            />
            <button
              type="button"
              onClick={copy}
              disabled={!linkActive}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-btn border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              {copied ? "Tersalin" : "Salin"}
            </button>
          </div>
        </div>

        {/* 2. Undang lewat email */}
        <div className="space-y-2">
          <span className="block text-[13px] font-medium text-ink">Undang lewat email</span>
          <div className="flex gap-2">
            <Input
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="email@klien.com, email2@klien.com"
              aria-label="Alamat email, pisahkan dengan koma"
              containerClassName="flex-1"
              disabled={!linkActive}
            />
            <Button onClick={invite} loading={inviting} disabled={!linkActive}>
              Undang
            </Button>
          </div>

          {!emailEnabled && (
            <p className="flex items-start gap-1.5 text-xs text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Pengiriman dari server belum aktif — undangan akan gagal. Pakai tombol
              aplikasi email di bawah, atau isi <span className="font-mono">RESEND_API_KEY</span> di server.
            </p>
          )}

          {failed.length > 0 && (
            <ul className="space-y-1 rounded-input border border-danger/30 bg-danger-soft p-2">
              {failed.map((f) => (
                <li key={f.email} className="flex items-start gap-1.5 text-xs text-danger">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span><span className="font-medium">{f.email}</span> — {f.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 3. Daftar akses */}
        <div>
          <span className="block text-[13px] font-medium text-ink">Yang sudah diundang</span>
          <ul className="divide-y divide-line">
            <AccessRow
              avatar={
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas text-muted">
                  <Globe className="h-4 w-4" />
                </span>
              }
              title="Siapa pun yang punya tautan"
              subtitle={linkActive ? undefined : "Tautan sedang nonaktif"}
            />
            {rows.length === 0 ? (
              <li className="py-3 text-xs text-muted">Belum ada yang diundang.</li>
            ) : (
              rows.map((r) => (
                <AccessRow
                  key={r.id}
                  avatar={
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold uppercase text-primary">
                      {r.email.charAt(0)}
                    </span>
                  }
                  title={r.email}
                  subtitle={`Dikirim ${relativeTime(r.lastSentAt)}${r.sendCount > 1 ? ` · ${r.sendCount}×` : ""}`}
                  action={
                    <button
                      type="button"
                      onClick={() => resend(r)}
                      disabled={resendingId !== null || !linkActive}
                      className={ghostSm}
                      aria-label={`Kirim ulang undangan ke ${r.email}`}
                    >
                      <RotateCw className={cn("h-3.5 w-3.5", resendingId === r.id && "animate-spin")} />
                      Kirim ulang
                    </button>
                  }
                />
              ))
            )}
          </ul>

          <p className="mt-2 text-xs leading-relaxed text-muted">
            Semua orang yang punya tautan ini dapat melihat invoice. Untuk mencabut akses,
            nonaktifkan tautan.
          </p>

          {/* Pencabutan akses yang sesungguhnya */}
          {linkActive ? (
            confirmOff ? (
              <div className="mt-2 space-y-2 rounded-input border border-danger/30 bg-danger-soft p-3">
                <p className="text-xs text-danger">
                  Tautan yang sudah kamu bagikan akan mati dan tidak bisa dibuka siapa pun.
                  Lanjutkan?
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setConfirmOff(false)} disabled={togglingLink}>
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-danger hover:bg-danger/90"
                    loading={togglingLink}
                    onClick={() => toggleLink(false)}
                  >
                    Ya, nonaktifkan
                  </Button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmOff(true)} className={cn(ghostSm, "mt-1 text-danger hover:bg-danger-soft")}>
                <Link2Off className="h-3.5 w-3.5" />
                Nonaktifkan tautan
              </button>
            )
          ) : (
            <Button
              size="sm"
              variant="secondary"
              className="mt-2"
              loading={togglingLink}
              onClick={() => toggleLink(true)}
              leftIcon={<Link2 className="h-4 w-4" />}
            >
              Aktifkan kembali tautan
            </Button>
          )}
        </div>

        {/* 4. Kanal lain */}
        <div className="space-y-2 border-t border-line pt-4">
          <span className="block text-[13px] font-medium text-ink">Kanal lain</span>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
            aria-label="Nomor WhatsApp klien"
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={openWhatsApp}
              disabled={!linkActive}
              className="flex-1"
              leftIcon={<MessageCircle className="h-4 w-4" />}
            >
              WhatsApp
            </Button>
            <Button
              variant="secondary"
              onClick={openMailApp}
              disabled={!linkActive}
              className="flex-1"
              leftIcon={<Mail className="h-4 w-4" />}
            >
              Aplikasi email
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
