"use client";

import { Bell, BellOff } from "lucide-react";
import { Dropdown } from "@/components/ui";

export function NotificationsMenu() {
  return (
    <Dropdown
      align="right"
      panelClassName="w-72"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Notifikasi"
          className="flex h-9 w-9 items-center justify-center rounded-btn text-ink-soft transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Bell className="h-5 w-5" />
        </button>
      )}
    >
      <div className="px-2.5 py-2">
        <p className="text-sm font-semibold text-ink">Notifikasi</p>
      </div>
      <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
        <BellOff className="h-6 w-6 text-muted" aria-hidden />
        <p className="text-sm text-muted">Belum ada notifikasi</p>
      </div>
    </Dropdown>
  );
}
