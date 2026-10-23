import Link from "next/link";
import { Crown } from "lucide-react";
import type { QuotaStatus } from "@/lib/plan/quota";

/**
 * Upgrade card — Free: sisa kuota + tombol Upgrade; Pro: status aktif.
 */
export function UpgradeCard({ collapsed = false, quota }: { collapsed?: boolean; quota?: QuotaStatus }) {
  const isPro = quota?.plan === "pro";

  if (collapsed) {
    return (
      <Link
        href="/settings"
        title={isPro ? "Bayaro Pro" : "Upgrade ke Pro"}
        aria-label={isPro ? "Bayaro Pro" : "Upgrade ke Pro"}
        className="flex h-10 w-10 items-center justify-center rounded-btn bg-primary-soft text-primary transition-colors hover:bg-primary hover:text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Crown className="h-5 w-5" />
      </Link>
    );
  }

  if (isPro) {
    return (
      <div className="rounded-card border border-primary/30 bg-primary-soft/60 p-3">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" aria-hidden />
          <span className="text-sm font-semibold text-ink">Bayaro Pro</span>
        </div>
        <p className="mt-1 text-xs text-muted">Invoice tanpa batas. Terima kasih! 🎉</p>
      </div>
    );
  }

  const used = quota?.used ?? 0;
  const limit = quota?.limit ?? 10;

  return (
    <div className="rounded-card border border-line bg-primary-soft/60 p-3">
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-primary" aria-hidden />
        <span className="text-sm font-semibold text-ink">Paket Free</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        <span className="font-mono tabular-nums text-ink">{used}/{limit}</span> invoice hari ini.
      </p>
      <Link
        href="/settings"
        className="mt-3 flex h-9 w-full items-center justify-center rounded-btn bg-primary text-sm font-medium text-surface shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        Upgrade ke Pro
      </Link>
    </div>
  );
}
