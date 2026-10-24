"use client";

import Link from "next/link";
import { Bell, BellOff, Receipt } from "lucide-react";
import { Dropdown } from "@/components/ui";
import { formatRupiah } from "@/lib/utils";
import type { PendingProof } from "@/lib/payment/actions";

/** Notifikasi: konfirmasi pembayaran dari klien yang menunggu ditinjau. */
export function NotificationsMenu({ pendingProofs = [] }: { pendingProofs?: PendingProof[] }) {
  const count = pendingProofs.length;

  return (
    <Dropdown
      align="right"
      panelClassName="w-80"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={count > 0 ? `Notifikasi, ${count} belum ditinjau` : "Notifikasi"}
          className="relative flex h-9 w-9 items-center justify-center rounded-btn text-ink-soft transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-surface">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="px-2.5 py-2">
            <p className="text-sm font-semibold text-ink">Notifikasi</p>
          </div>
          {count === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <BellOff className="h-6 w-6 text-muted" aria-hidden />
              <p className="text-sm text-muted">Belum ada notifikasi</p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-auto">
              {pendingProofs.map((p) => (
                <li key={p.id}>
                  <Link
                    href="/invoices"
                    onClick={close}
                    className="flex gap-2.5 rounded-btn px-2.5 py-2 transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
                      <Receipt className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm text-ink">
                        <span className="font-mono">{p.number}</span> menunggu konfirmasi
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {p.clientName ?? "Klien"}
                        {p.amount !== null && ` · Rp ${formatRupiah(p.amount)}`}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Dropdown>
  );
}
