"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

/**
 * Overlay "sedang bekerja" untuk aksi berat yang memblokir (simpan invoice,
 * buat workspace, ekspor PDF). Aksi ringan cukup memakai spinner di tombol.
 *
 * Dua jeda yang membuatnya terasa tenang:
 * - SHOW_DELAY: aksi yang selesai cepat tidak sempat memunculkan overlay,
 *   sehingga layar tidak berkedip.
 * - MIN_VISIBLE: begitu tampil, overlay ditahan sebentar supaya tidak
 *   berkelebat hilang.
 */

const SHOW_DELAY = 400;
const MIN_VISIBLE = 300;

interface BusyContextValue {
  /** Jalankan aksi sambil menampilkan overlay. Pesan tampil di bawah spinner. */
  runBusy: <T>(message: string, action: () => Promise<T>) => Promise<T>;
  busy: boolean;
}

const BusyContext = React.createContext<BusyContextValue | null>(null);

export function useBusy(): BusyContextValue {
  const ctx = React.useContext(BusyContext);
  if (!ctx) throw new Error("useBusy harus dipakai di dalam <BusyProvider>");
  return ctx;
}

export function BusyProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const returnFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => setMounted(true), []);

  const runBusy = React.useCallback(async <T,>(msg: string, action: () => Promise<T>): Promise<T> => {
    returnFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    let shownAt = 0;
    const timer = setTimeout(() => {
      shownAt = Date.now();
      setMessage(msg);
    }, SHOW_DELAY);

    try {
      return await action();
    } finally {
      clearTimeout(timer);
      if (shownAt) {
        const sisa = MIN_VISIBLE - (Date.now() - shownAt);
        if (sisa > 0) await new Promise((r) => setTimeout(r, sisa));
      }
      setMessage(null);
      // Kembalikan fokus ke tombol pemicu bila elemennya masih ada.
      const el = returnFocusRef.current;
      if (el?.isConnected) el.focus();
      returnFocusRef.current = null;
    }
  }, []);

  // Selagi overlay tampil, fokus dikunci di kartunya supaya Tab tidak
  // menyasar ke kontrol di belakang yang sedang tidak boleh dipakai.
  React.useEffect(() => {
    if (!message) return;
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      // Esc sengaja tidak menutup: aksi tidak bisa dibatalkan di tengah jalan.
      if (e.key === "Tab") e.preventDefault();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [message]);

  const value = React.useMemo(() => ({ runBusy, busy: message !== null }), [runBusy, message]);

  return (
    <BusyContext.Provider value={value}>
      {children}
      {mounted &&
        message &&
        createPortal(
          <div
            role="alertdialog"
            aria-busy="true"
            aria-live="assertive"
            aria-label={message}
            className="fixed inset-0 z-[55] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[2px]"
          >
            <div
              ref={cardRef}
              tabIndex={-1}
              className="flex items-center gap-3 rounded-card border border-line bg-surface px-5 py-4 shadow-modal outline-none"
            >
              <Loader2
                className="h-5 w-5 shrink-0 animate-spin text-primary motion-reduce:animate-pulse motion-reduce:[animation-duration:1.5s]"
                aria-hidden
              />
              <p className="text-sm font-medium text-ink">{message}</p>
            </div>
          </div>,
          document.body
        )}
    </BusyContext.Provider>
  );
}
