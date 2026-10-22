import { cn } from "@/lib/utils";

/**
 * BayaroMark — mark "b" geometris (pixel tile + stem + bowl).
 * Mewarisi warna lewat `currentColor` (mis. `bone` di atas panel `ink`).
 */
export function BayaroMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Logo Bayaro"
    >
      {/* pixel tile kiri-atas */}
      <rect x="26" y="20" width="20" height="20" rx="2" />
      {/* stem */}
      <rect x="40" y="34" width="16" height="66" rx="3" />
      {/* bowl (lingkaran luar) dengan counter (lubang) via even-odd */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M62 46 a26 26 0 1 0 0 52 a26 26 0 1 0 0 -52 Z
           M62 61 a11 11 0 1 0 0 22 a11 11 0 1 0 0 -22 Z"
      />
    </svg>
  );
}

/**
 * Logo — mark di dalam tile `ink` + wordmark "Bayaro".
 * Dipakai di landing, nanti juga di sidebar/topbar.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-card bg-ink text-bone">
        <BayaroMark className="h-7 w-7" />
      </span>
      {showWordmark && (
        <span className="text-2xl font-bold tracking-tight text-ink">Bayaro</span>
      )}
    </div>
  );
}
