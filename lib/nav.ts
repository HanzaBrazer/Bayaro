import { LayoutGrid, FileText, Users, LayoutTemplate, Settings, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/invoices", label: "Invoice", icon: FileText },
  { href: "/clients", label: "Klien", icon: Users },
  { href: "/templates", label: "Template", icon: LayoutTemplate },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

/** Apakah `pathname` berada di dalam rute `href` (exact atau nested). */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Judul halaman untuk topbar berdasarkan path aktif. */
export function titleForPath(pathname: string): string {
  const match = NAV_ITEMS.find((item) => isActivePath(pathname, item.href));
  return match?.label ?? "Bayaro";
}
