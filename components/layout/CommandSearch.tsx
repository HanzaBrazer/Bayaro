"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Modal } from "@/components/ui";

export function CommandSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Desktop: field lebar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 items-center gap-2 rounded-input border border-line bg-canvas px-3 text-sm text-muted transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex sm:w-64"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Cari invoice, klien…</span>
        <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted">⌘K</kbd>
      </button>

      {/* Mobile: ikon saja */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Cari"
        className="flex h-9 w-9 items-center justify-center rounded-btn text-ink-soft transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:hidden"
      >
        <Search className="h-5 w-5" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Pencarian">
        <div className="space-y-3">
          <div className="flex h-10 items-center gap-2 rounded-input border border-line bg-surface px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary">
            <Search className="h-4 w-4 text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nomor invoice atau nama klien…"
              className="h-full w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
            />
          </div>
          <p className="py-6 text-center text-sm text-muted">
            Pencarian akan aktif setelah data invoice &amp; klien tersedia (Langkah 6–7).
          </p>
        </div>
      </Modal>
    </>
  );
}
