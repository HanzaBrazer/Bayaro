"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Loader2, Plus, Settings } from "lucide-react";
import { useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { switchWorkspace, type WorkspaceSummary } from "@/lib/workspace/actions";

export interface Brand {
  name: string;
  logoUrl: string | null;
  /** id workspace aktif. */
  id?: string | null;
  /** Semua workspace milik user, untuk berpindah. */
  workspaces?: WorkspaceSummary[];
  plan?: "free" | "pro";
}

function Mark({ name, logoUrl, size = "md" }: { name: string; logoUrl: string | null; size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-7 w-7 text-xs" : "h-8 w-8 text-sm";
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt="" className={cn(box, "shrink-0 rounded-btn border border-line bg-surface object-contain")} />;
  }
  return (
    <span className={cn(box, "flex shrink-0 items-center justify-center rounded-btn bg-ink font-bold text-bone")}>
      {name.charAt(0).toUpperCase() || "U"}
    </span>
  );
}

/**
 * Pemilih workspace (multi-bisnis), gaya mengacu dropdown ClickUp:
 * kepala workspace aktif → daftar untuk berpindah → "Buat workspace".
 */
export function WorkspaceSwitcher({ collapsed = false, brand }: { collapsed?: boolean; brand?: Brand }) {
  const router = useRouter();
  const toast = useToast();
  const name = brand?.name?.trim() || "Usaha Saya";
  const logoUrl = brand?.logoUrl ?? null;
  const all = brand?.workspaces ?? [];

  const [open, setOpen] = React.useState(false);
  const [switching, setSwitching] = React.useState<string | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();

  const close = React.useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (!open) return;
    // Fokus ke item pertama agar bisa langsung dipakai dengan keyboard.
    panelRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus();
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, close]);

  function onPanelKey(e: React.KeyboardEvent) {
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []
    );
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === "Tab") {
      close(false);
    }
  }

  async function pick(ws: WorkspaceSummary) {
    if (switching) return;
    if (ws.id === brand?.id) return close();
    setSwitching(ws.id);
    try {
      const res = await switchWorkspace(ws.id);
      if (res.error) return toast.error("Gagal berpindah", res.error);
      setOpen(false);
      toast.success(`Beralih ke ${ws.name}`);
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Gagal berpindah", "Jaringan bermasalah. Coba lagi.");
    } finally {
      setSwitching(null);
    }
  }

  const itemCls =
    "flex min-h-[44px] w-full items-center gap-2.5 rounded-btn px-2.5 text-left text-sm text-ink transition-colors hover:bg-canvas focus-visible:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Workspace: ${name}. Buka untuk berpindah atau membuat workspace.`}
        title={collapsed ? name : undefined}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-btn border border-line bg-surface p-1.5 text-left transition-colors hover:border-primary/50 hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          open && "border-primary/50 bg-canvas",
          collapsed && "justify-center"
        )}
      >
        <Mark name={name} logoUrl={logoUrl} />
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

      {open && (
        <div
          ref={panelRef}
          id={menuId}
          role="menu"
          aria-label="Workspace"
          onKeyDown={onPanelKey}
          className={cn(
            "absolute top-full z-50 mt-2 rounded-card border border-line bg-surface p-1.5 shadow-dropdown",
            collapsed ? "left-0 w-72" : "left-0 right-0 min-w-[16rem]"
          )}
        >
          {/* Kepala: workspace aktif */}
          <div className="flex items-center gap-2.5 px-2 pb-2.5 pt-1.5">
            <Mark name={name} logoUrl={logoUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink" title={name}>
                {name}
              </p>
              <p className="text-xs text-muted">Paket {brand?.plan === "pro" ? "Pro" : "Free"}</p>
            </div>
          </div>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={cn(itemCls, "mb-1 justify-center border border-line font-medium")}
          >
            <Settings className="h-4 w-4 text-muted" /> Pengaturan workspace
          </Link>

          <div className="my-1 h-px bg-line" />
          <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Ganti workspace
          </p>
          <div className="max-h-64 overflow-auto">
            {all.length <= 1 ? (
              <p className="px-2.5 py-2 text-xs text-muted">Belum ada workspace lain.</p>
            ) : (
              all.map((ws) => {
                const active = ws.id === brand?.id;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    role="menuitem"
                    aria-current={active ? "true" : undefined}
                    onClick={() => pick(ws)}
                    disabled={switching !== null && switching !== ws.id}
                    className={cn(itemCls, active && "font-semibold")}
                  >
                    <Mark name={ws.name} logoUrl={ws.logoUrl} size="sm" />
                    <span className="min-w-0 flex-1 truncate" title={ws.name}>
                      {ws.name}
                    </span>
                    {switching === ws.id ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-label="Berpindah…" />
                    ) : (
                      active && <Check className="h-4 w-4 shrink-0 text-primary" aria-label="Aktif" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="my-1 h-px bg-line" />
          <Link
            href="/workspaces/new"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={cn(itemCls, "font-medium text-primary")}
          >
            <Plus className="h-4 w-4" /> Buat workspace
          </Link>
        </div>
      )}
    </div>
  );
}
