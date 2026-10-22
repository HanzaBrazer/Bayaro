import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Workspace switcher — MVP: tampil 1 workspace, non-aktif.
 * UI multi-workspace diaktifkan di fase lanjut (brief §10).
 */
export function WorkspaceSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <button
      type="button"
      disabled
      title="Multi-workspace tersedia di fase lanjut"
      aria-label="Usaha Saya — multi-workspace di fase lanjut"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-btn border border-line bg-surface p-1.5 text-left disabled:cursor-not-allowed disabled:opacity-80",
        collapsed && "justify-center"
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-btn bg-ink text-sm font-bold text-bone">
        U
      </span>
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">Usaha Saya</span>
            <span className="block truncate text-xs text-muted">Workspace</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        </>
      )}
    </button>
  );
}
