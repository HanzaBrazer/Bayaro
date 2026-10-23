import { Download } from "lucide-react";
import { BayaroMark } from "@/components/brand/Logo";

export function PublicInvoiceActions({ token, number }: { token: string; number: string }) {
  const btn =
    "inline-flex h-10 items-center gap-2 rounded-btn border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-card bg-ink text-bone">
          <BayaroMark className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs text-muted">Invoice</p>
          <p className="font-mono text-base font-semibold text-ink">{number}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <a href={`/api/i/${token}/pdf`} className={btn}>
          <Download className="h-4 w-4" /> Unduh PDF
        </a>
        <a href={`/api/i/${token}/png`} className={btn}>
          <Download className="h-4 w-4" /> Unduh PNG
        </a>
      </div>
    </div>
  );
}
