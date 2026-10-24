import { cn } from "@/lib/utils";

/**
 * Skeleton — placeholder berdenyut saat memuat data/halaman.
 * Dipakai di file `loading.tsx` tiap rute (Suspense fallback App Router).
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-btn bg-line/80", className)} />;
}

/** Kartu kosong ber-skeleton (shell kartu + konten). */
export function SkeletonCard({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("rounded-card border border-line bg-surface p-5", className)}>{children}</div>
  );
}
