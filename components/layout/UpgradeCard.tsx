import Link from "next/link";
import { Crown } from "lucide-react";

/**
 * Upgrade card — tampil hanya untuk plan Free (brief §6, design §4.1).
 * Angka kuota masih placeholder; logika real di Langkah 9.
 */
export function UpgradeCard({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <Link
        href="/settings"
        title="Upgrade ke Pro"
        aria-label="Upgrade ke Pro"
        className="flex h-10 w-10 items-center justify-center rounded-btn bg-primary-soft text-primary transition-colors hover:bg-primary hover:text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Crown className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <div className="rounded-card border border-line bg-primary-soft/60 p-3">
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-primary" aria-hidden />
        <span className="text-sm font-semibold text-ink">Paket Free</span>
      </div>
      <p className="mt-1 text-xs text-muted">Kuota 10 invoice/hari. Upgrade untuk tanpa batas.</p>
      <Link
        href="/settings"
        className="mt-3 flex h-9 w-full items-center justify-center rounded-btn bg-primary text-sm font-medium text-surface shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        Upgrade ke Pro
      </Link>
    </div>
  );
}
