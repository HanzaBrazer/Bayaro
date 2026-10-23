"use client";

import * as React from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Crown, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, Button, Badge, useToast } from "@/components/ui";
import { createUpgradeOrder } from "@/lib/billing/actions";
import type { BillingInfo } from "@/lib/billing/constants";
import { formatRupiah, formatDateID } from "@/lib/utils";

interface SnapCallbacks {
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: () => void;
  onClose?: () => void;
}
declare global {
  interface Window {
    snap?: { pay: (token: string, opts: SnapCallbacks) => void };
  }
}

const STATUS_TONE: Record<string, "green" | "amber" | "neutral" | "red"> = {
  active: "green",
  pending: "amber",
  inactive: "neutral",
  expired: "red",
};

export function BillingPanel({
  billing,
  snapJsUrl,
  clientKey,
}: {
  billing: BillingInfo;
  snapJsUrl: string;
  clientKey: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const isPro = billing.plan === "pro";

  async function upgrade() {
    setLoading(true);
    const res = await createUpgradeOrder();
    if (res.error || !res.token) {
      setLoading(false);
      return toast.error("Gagal memulai pembayaran", res.error ?? "Coba lagi.");
    }
    if (!window.snap) {
      setLoading(false);
      return toast.error("Snap belum siap", "Muat ulang halaman lalu coba lagi.");
    }
    window.snap.pay(res.token, {
      onSuccess: () => {
        toast.success("Pembayaran diterima", "Pro aktif dalam beberapa detik.");
        setLoading(false);
        setTimeout(() => router.refresh(), 2500);
      },
      onPending: () => {
        toast.info("Menunggu pembayaran", "Selesaikan pembayaranmu.");
        setLoading(false);
      },
      onError: () => {
        toast.error("Pembayaran gagal", "Silakan coba lagi.");
        setLoading(false);
      },
      onClose: () => setLoading(false),
    });
  }

  return (
    <div className="space-y-4">
      <Script src={snapJsUrl} data-client-key={clientKey} strategy="afterInteractive" />

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-card bg-primary-soft text-primary">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-muted">Paket saat ini</p>
              <p className="text-lg font-semibold text-ink">
                {isPro ? "Bayaro Pro" : "Bayaro Free"}
                {isPro && billing.currentPeriodEnd && (
                  <span className="ml-2 text-sm font-normal text-muted">aktif s/d {formatDateID(billing.currentPeriodEnd)}</span>
                )}
              </p>
            </div>
          </div>
          {isPro ? (
            <Badge tone="green">
              <Sparkles className="h-3 w-3" /> Aktif
            </Badge>
          ) : (
            <Button leftIcon={<Crown className="h-4 w-4" />} onClick={upgrade} loading={loading}>
              Upgrade ke Pro — Rp {formatRupiah(billing.price)}/bln
            </Button>
          )}
        </div>
        {!isPro && (
          <p className="mt-4 rounded-btn bg-canvas p-3 text-xs text-muted">
            Pro: buat invoice <span className="font-medium text-ink">tanpa batas</span> &amp; tanpa watermark. Pembayaran
            QRIS/VA/kartu lewat Midtrans; status aktif otomatis via webhook.
          </p>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Riwayat transaksi</CardTitle>
        </CardHeader>
        {billing.history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Belum ada transaksi.</p>
        ) : (
          <ul className="divide-y divide-line">
            {billing.history.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm text-ink">{t.order_id ?? "—"}</p>
                  <p className="text-xs text-muted">{formatDateID(t.created_at)} · {t.plan}</p>
                </div>
                <Badge tone={STATUS_TONE[t.status] ?? "neutral"}>{t.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
