"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActivePath } from "@/lib/nav";
import { BayaroMark } from "@/components/brand/Logo";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { UpgradeCard } from "./UpgradeCard";
import type { QuotaStatus } from "@/lib/plan/quota";

export function MobileNav({ quota }: { quota?: QuotaStatus }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [show, setShow] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    setShow(false);
    const raf = requestAnimationFrame(() => setShow(true));
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka menu navigasi"
        className="flex h-9 w-9 items-center justify-center rounded-btn text-ink-soft transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              aria-hidden
              onClick={() => setOpen(false)}
              className={cn(
                "absolute inset-0 bg-ink/40 transition-opacity duration-200 motion-reduce:transition-none",
                show ? "opacity-100" : "opacity-0"
              )}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Navigasi"
              className={cn(
                "absolute left-0 top-0 flex h-full w-[260px] flex-col border-r border-line bg-surface shadow-modal transition-transform duration-200 ease-out motion-reduce:transition-none",
                show ? "translate-x-0" : "-translate-x-full"
              )}
            >
              <div className="flex h-16 items-center justify-between px-4">
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-card bg-ink text-bone">
                    <BayaroMark className="h-5 w-5" />
                  </span>
                  <span className="text-lg font-bold tracking-tight text-ink">Bayaro</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Tutup menu"
                  className="flex h-9 w-9 items-center justify-center rounded-btn text-muted transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-3">
                <WorkspaceSwitcher />
              </div>

              <nav className="mt-3 flex-1 space-y-1 px-3" aria-label="Navigasi utama">
                {NAV_ITEMS.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-btn px-2.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        active ? "bg-primary-soft text-primary" : "text-ink-soft hover:bg-canvas hover:text-ink"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" aria-hidden />
                      )}
                      <Icon className="h-5 w-5 shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3">
                <UpgradeCard quota={quota} />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
