"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface DropdownProps {
  trigger: (state: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: "left" | "right";
  panelClassName?: string;
  className?: string;
  /** Render panel ke portal (fixed) agar lolos dari kontainer overflow (mis. tabel). */
  portal?: boolean;
}

export function Dropdown({ trigger, children, align = "left", panelClassName, className, portal = false }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left?: number; right?: number }>({ top: 0 });
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    if (portal && rootRef.current) {
      const r = rootRef.current.getBoundingClientRect();
      setCoords(
        align === "right"
          ? { top: r.bottom + 4, right: window.innerWidth - r.right }
          : { top: r.bottom + 4, left: r.left }
      );
    }
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, portal, align]);

  const panel = (
    <div
      ref={panelRef}
      role="menu"
      style={portal ? { position: "fixed", top: coords.top, left: coords.left, right: coords.right } : undefined}
      className={cn(
        "z-50 min-w-[12rem] rounded-card border border-line bg-surface p-1 shadow-dropdown",
        !portal && "absolute mt-2 z-40",
        !portal && (align === "right" ? "right-0" : "left-0"),
        portal && "max-h-[70vh] overflow-auto",
        panelClassName
      )}
    >
      {typeof children === "function" ? children(close) : children}
    </div>
  );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (portal ? mounted && createPortal(panel, document.body) : panel)}
    </div>
  );
}

export interface DropdownItemProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function DropdownItem({ children, icon, href, onClick, danger, disabled }: DropdownItemProps) {
  const cls = cn(
    "flex w-full items-center gap-2.5 rounded-btn px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
    danger ? "text-danger hover:bg-danger-soft" : "text-ink hover:bg-canvas"
  );
  if (href && !disabled) {
    return (
      <Link href={href} onClick={onClick} className={cls} role="menuitem">
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls} role="menuitem">
      {icon}
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 h-px bg-line" />;
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2.5 py-1.5 text-xs font-medium text-muted">{children}</div>;
}
