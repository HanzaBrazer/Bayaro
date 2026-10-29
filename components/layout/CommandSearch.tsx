"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Loader2, CornerDownLeft } from "lucide-react";
import { Modal, StatusBadge, type InvoiceStatus } from "@/components/ui";
import { cn, formatRupiah } from "@/lib/utils";
import { searchEverything } from "@/lib/search/actions";
import type { SearchResults } from "@/lib/search/types";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;
const EMPTY: SearchResults = { invoices: [], clients: [] };

/** Satu baris hasil, bisa dipilih lewat keyboard maupun klik. */
type Row = { key: string; href: string; render: React.ReactNode };

export function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResults>(EMPTY);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Buka/tutup dengan Ctrl/Cmd+K
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

  // Reset tiap kali dibuka
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setResults(EMPTY);
      setError(null);
      setLoading(false);
      setActive(0);
    }
  }, [open]);

  // Cari dengan jeda ketik; balasan usang diabaikan agar hasil tak melompat.
  React.useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_CHARS) {
      setResults(EMPTY);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchEverything(q);
        if (cancelled) return;
        setResults(res);
        setError(null);
        setActive(0);
      } catch {
        if (!cancelled) setError("Pencarian gagal. Coba lagi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  // Gabungkan jadi satu daftar datar supaya navigasi keyboard sederhana.
  const rows: Row[] = React.useMemo(() => {
    const out: Row[] = [];
    for (const inv of results.invoices) {
      out.push({
        key: `inv-${inv.id}`,
        href: `/invoices/${inv.id}/edit`,
        render: (
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-btn bg-canvas text-muted">
              <FileText className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-mono text-sm text-ink">{inv.number}</span>
              <span className="block truncate text-xs text-muted">{inv.clientName || "—"}</span>
            </span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-ink-soft">
              Rp {formatRupiah(inv.total)}
            </span>
            <StatusBadge status={inv.status as InvoiceStatus} />
          </>
        ),
      });
    }
    for (const c of results.clients) {
      out.push({
        key: `cli-${c.id}`,
        href: `/clients/${c.id}`,
        render: (
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold uppercase text-primary">
              {c.name.charAt(0)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-ink">{c.name}</span>
              {c.email && <span className="block truncate text-xs text-muted">{c.email}</span>}
            </span>
          </>
        ),
      });
    }
    return out;
  }, [results]);

  const go = React.useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (rows.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % rows.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + rows.length) % rows.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[active];
      if (row) go(row.href);
    }
  }

  // Jaga baris aktif tetap terlihat saat dinavigasi dengan panah.
  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const q = query.trim();
  const invCount = results.invoices.length;

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
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Cari nomor invoice atau nama klien…"
              aria-label="Kata kunci pencarian"
              role="combobox"
              aria-expanded={rows.length > 0}
              aria-controls="search-results"
              className="h-full w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
            />
            {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" />}
          </div>

          {/* Hasil / state */}
          {error ? (
            <p className="py-6 text-center text-sm text-danger">{error}</p>
          ) : q.length < MIN_CHARS ? (
            <p className="py-6 text-center text-sm text-muted">
              Ketik minimal {MIN_CHARS} huruf — cari berdasarkan nomor invoice, nama klien, atau email.
            </p>
          ) : !loading && rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Tidak ada hasil untuk “{q}”.
            </p>
          ) : (
            <div ref={listRef} id="search-results" role="listbox" className="max-h-80 space-y-0.5 overflow-auto">
              {invCount > 0 && (
                <p className="px-1 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Invoice
                </p>
              )}
              {rows.map((row, i) => {
                const isFirstClient = invCount > 0 && i === invCount;
                return (
                  <React.Fragment key={row.key}>
                    {(i === invCount && results.clients.length > 0) && (
                      <p
                        className={cn(
                          "px-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted",
                          isFirstClient && "pt-2"
                        )}
                      >
                        Klien
                      </p>
                    )}
                    <button
                      type="button"
                      data-idx={i}
                      role="option"
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(row.href)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-btn px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        i === active ? "bg-canvas" : "hover:bg-canvas"
                      )}
                    >
                      {row.render}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {rows.length > 0 && (
            <p className="flex items-center justify-center gap-3 border-t border-line pt-2 text-[11px] text-muted">
              <span>↑↓ pilih</span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="h-3 w-3" /> buka
              </span>
              <span>Esc tutup</span>
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
