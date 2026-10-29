"use client";

import { ChevronDown, User, CreditCard, HelpCircle, LogOut } from "lucide-react";
import { Dropdown, DropdownItem, DropdownDivider, useToast } from "@/components/ui";
import { signOutAction } from "@/lib/auth/actions";
import type { AccountProfile } from "@/lib/auth/profile";

/** Fallback aman bila profil gagal dimuat — jangan pernah tampilkan "undefined". */
const FALLBACK: AccountProfile = { name: "Akun", email: "", initial: "A" };

export function AccountMenu({ account }: { account?: AccountProfile | null }) {
  const toast = useToast();
  const me = account ?? FALLBACK;

  return (
    <Dropdown
      align="right"
      panelClassName="w-60"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={me.email ? `Menu akun — ${me.email}` : "Menu akun"}
          className="flex items-center gap-1.5 rounded-btn p-1 transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
            {me.initial}
          </span>
          <ChevronDown className="h-4 w-4 text-muted" aria-hidden />
        </button>
      )}
    >
      {(close) => (
        <>
          {/* Identitas: teks biasa, bukan menuitem — tidak bisa difokus lewat Tab. */}
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-semibold text-ink" title={me.name}>
              {me.name}
            </p>
            {me.email && (
              <p className="truncate text-xs text-muted" title={me.email}>
                {me.email}
              </p>
            )}
          </div>
          <DropdownDivider />
          <DropdownItem href="/settings" icon={<User className="h-4 w-4" />} onClick={close}>
            Profil
          </DropdownItem>
          <DropdownItem href="/settings" icon={<CreditCard className="h-4 w-4" />} onClick={close}>
            Billing
          </DropdownItem>
          <DropdownItem
            icon={<HelpCircle className="h-4 w-4" />}
            onClick={() => {
              close();
              toast.info("Bantuan", "Pusat bantuan akan tersedia segera.");
            }}
          >
            Bantuan
          </DropdownItem>
          <DropdownDivider />
          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-btn px-2.5 py-2 text-left text-sm text-danger transition-colors hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </form>
        </>
      )}
    </Dropdown>
  );
}
