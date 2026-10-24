"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActivePath } from "@/lib/nav";
import { BayaroMark } from "@/components/brand/Logo";
import { WorkspaceSwitcher, type Brand } from "./WorkspaceSwitcher";
import { UpgradeCard } from "./UpgradeCard";
import type { QuotaStatus } from "@/lib/plan/quota";

/**
 * Sidebar desktop (248px) / tablet collapse (72px ikon-only).
 * Mobile memakai MobileNav (drawer) di topbar.
 */
export function AppSidebar({ quota, brand }: { quota?: QuotaStatus; brand?: Brand }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[72px] shrink-0 flex-col border-r border-line bg-surface md:flex lg:w-[248px]">
      {/* Logo */}
      <div className="flex h-16 items-center px-3 lg:px-4">
        <Link
          href="/dashboard"
          aria-label="Bayaro — ke Dashboard"
          className="flex items-center gap-2.5 rounded-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card bg-ink text-bone">
            <BayaroMark className="h-5 w-5" />
          </span>
          <span className="hidden text-lg font-bold tracking-tight text-ink lg:block">Bayaro</span>
        </Link>
      </div>

      {/* Workspace switcher */}
      <div className="px-2 lg:px-3">
        <div className="hidden lg:block">
          <WorkspaceSwitcher brand={brand} />
        </div>
        <div className="flex justify-center lg:hidden">
          <WorkspaceSwitcher collapsed brand={brand} />
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-3 flex-1 space-y-1 px-2 lg:px-3" aria-label="Navigasi utama">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-btn px-2.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:justify-start",
                "justify-center lg:justify-start",
                active ? "bg-primary-soft text-primary" : "text-ink-soft hover:bg-canvas hover:text-ink"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" aria-hidden />
              )}
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Upgrade card */}
      <div className="p-2 lg:p-3">
        <div className="hidden lg:block">
          <UpgradeCard quota={quota} />
        </div>
        <div className="flex justify-center lg:hidden">
          <UpgradeCard collapsed quota={quota} />
        </div>
      </div>
    </aside>
  );
}
