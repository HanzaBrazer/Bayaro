import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Brand {
  name: string;
  logoUrl: string | null;
}

/**
 * Workspace switcher — MVP: tampil 1 workspace, non-aktif.
 * Menampilkan nama & logo usaha asli (diubah lewat Pengaturan > Profil).
 * UI multi-workspace diaktifkan di fase lanjut (brief §10).
 */
export function WorkspaceSwitcher({ collapsed = false, brand }: { collapsed?: boolean; brand?: Brand }) {
  const name = brand?.name?.trim() || "Usaha Saya";
  const logoUrl = brand?.logoUrl ?? null;
  const initial = name.charAt(0).toUpperCase() || "U";

  return (
    <button
      type="button"
      disabled
      title="Multi-workspace tersedia di fase lanjut"
      aria-label={`${name} — multi-workspace di fase lanjut`}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-btn border border-line bg-surface p-1.5 text-left disabled:cursor-not-allowed disabled:opacity-80",
        collapsed && "justify-center"
      )}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="h-8 w-8 shrink-0 rounded-btn border border-line bg-surface object-contain"
        />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-btn bg-ink text-sm font-bold text-bone">
          {initial}
        </span>
      )}
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">{name}</span>
            <span className="block truncate text-xs text-muted">Workspace</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        </>
      )}
    </button>
  );
}
