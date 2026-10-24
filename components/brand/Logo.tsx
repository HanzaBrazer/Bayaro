import { cn } from "@/lib/utils";

/**
 * BayaroMark — mark "b" geometris (pixel tile + stem + bowl).
 * Mewarisi warna lewat `currentColor` (mis. `bone` di atas panel `ink`).
 */
export function BayaroMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 296 374"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Logo Bayaro"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M126.065 78.4683C137.62 78.4589 151.419 78.0846 162.695 79.2056C196.2 82.6816 227.505 97.5262 251.397 121.268C279.369 148.834 295.176 186.433 295.288 225.706C295.188 264.996 279.474 302.635 251.601 330.332C223.857 357.819 186.388 373.263 147.332 373.31C108.044 373.064 70.4542 357.259 42.7982 329.354C19.7708 305.881 5.15865 275.45 1.23965 242.803C-0.300019 230.269 0.0265721 217.863 0.0335974 205.262L0.0775427 158.225L80.0688 158.19L80.0824 78.5337L126.065 78.4683ZM165.347 160.385C153.562 157.219 136.894 158.093 124.333 158.108L80.0688 158.19C80.3445 173.596 79.8982 189.362 80.0815 204.786C80.2331 217.552 79.1686 230.387 82.3334 242.832C85.1939 253.979 90.8777 264.203 98.8363 272.516C111.028 285.337 127.791 292.824 145.477 293.345C165.446 293.932 181.178 287.083 195.55 273.577C208.278 259.82 215.245 244.675 215.332 225.839C215.45 207.904 208.336 190.678 195.597 178.054C187.225 169.629 176.798 163.538 165.347 160.385Z"
      />
      <path d="M0.0992058 0L80.1208 0.0374804L80.0824 78.5337C53.4187 78.7579 26.7541 78.8024 0.0898438 78.6671L0.0992058 0Z" />
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
