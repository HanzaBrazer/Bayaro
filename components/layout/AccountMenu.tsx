"use client";

import { ChevronDown, User, CreditCard, HelpCircle, LogOut } from "lucide-react";
import { Dropdown, DropdownItem, DropdownDivider, useToast } from "@/components/ui";
import { signOutAction } from "@/lib/auth/actions";

export function AccountMenu() {
  const toast = useToast();

  return (
    <Dropdown
      align="right"
      panelClassName="min-w-[14rem]"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Menu akun"
          className="flex items-center gap-1.5 rounded-btn p-1 transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
            R
          </span>
          <ChevronDown className="h-4 w-4 text-muted" aria-hidden />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-semibold text-ink">Akun Bayaro</p>
            <p className="truncate text-xs text-muted">Masuk untuk sinkron data</p>
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
              onClick={close}
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
