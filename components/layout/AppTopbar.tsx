"use client";

import { usePathname } from "next/navigation";
import { titleForPath } from "@/lib/nav";
import type { QuotaStatus } from "@/lib/plan/quota";
import { MobileNav } from "./MobileNav";
import { CommandSearch } from "./CommandSearch";
import { NotificationsMenu } from "./NotificationsMenu";
import { AccountMenu } from "./AccountMenu";
import type { Brand } from "./WorkspaceSwitcher";
import type { PendingProof } from "@/lib/payment/actions";
import type { AccountProfile } from "@/lib/auth/profile";

export function AppTopbar({
  quota,
  brand,
  pendingProofs,
  account,
}: {
  quota?: QuotaStatus;
  brand?: Brand;
  pendingProofs?: PendingProof[];
  account?: AccountProfile | null;
}) {
  const pathname = usePathname();
  const title = titleForPath(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur md:px-6">
      <MobileNav quota={quota} brand={brand} />
      <h1 className="truncate text-xl font-bold tracking-tight text-ink">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <CommandSearch />
        <NotificationsMenu pendingProofs={pendingProofs} />
        <AccountMenu account={account} />
      </div>
    </header>
  );
}
