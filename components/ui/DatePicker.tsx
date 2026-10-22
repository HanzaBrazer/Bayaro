"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateID } from "@/lib/utils";

export interface DatePickerQuickButton {
  label: string;
  /** Jumlah hari dari hari ini (mis. 14, 30). */
  days: number;
}

export interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  label?: string;
  helper?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  quickButtons?: DatePickerQuickButton[];
}

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function DatePicker({
  value,
  onChange,
  label,
  helper,
  error,
  disabled,
  id,
  className,
  quickButtons,
}: DatePickerProps) {
  const reactId = React.useId();
  const fieldId = id ?? reactId;
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<Date>(() => value ?? new Date());
  const rootRef = React.useRef<HTMLDivElement>(null);
  const today = React.useMemo(() => new Date(), []);

  React.useEffect(() => {
    if (open && value) setView(value);
  }, [open, value]);

  React.useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const pick = (d: Date) => {
    onChange(d);
    setOpen(false);
  };

  const applyQuick = (days: number) => {
    const base = new Date();
    base.setDate(base.getDate() + days);
    pick(base);
  };

  const fieldClasses = cn(
    "flex h-10 w-full items-center gap-2 rounded-input border bg-surface px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-canvas disabled:opacity-60",
    error ? "border-danger focus-visible:ring-danger" : "border-line focus-visible:border-primary focus-visible:ring-primary"
  );

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={fieldId} className="block text-[13px] font-medium text-ink">
          {label}
        </label>
      )}

      {/* Mobile: native date input (picker OS) */}
      <input
        type="date"
        id={`${fieldId}-native`}
        disabled={disabled}
        value={value ? toISODate(value) : ""}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) return;
          const [y, m, d] = v.split("-").map(Number);
          onChange(new Date(y, m - 1, d));
        }}
        className={cn(fieldClasses, "sm:hidden", !value && "text-muted")}
      />

      {/* Desktop: kalender custom */}
      <div ref={rootRef} className="relative hidden sm:block">
        <button
          type="button"
          id={fieldId}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => !disabled && setOpen((o) => !o)}
          className={cn(fieldClasses, open && !error && "border-primary ring-2 ring-primary")}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-muted" />
          <span className={cn(!value && "text-muted")}>{value ? formatDateID(value) : "Pilih tanggal"}</span>
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Pilih tanggal"
            className="absolute z-20 mt-1 w-[280px] rounded-card border border-line bg-surface p-3 shadow-dropdown"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                aria-label="Bulan sebelumnya"
                onClick={() => setView(new Date(year, month - 1, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-ink">
                {MONTHS[month]} {year}
              </span>
              <button
                type="button"
                aria-label="Bulan berikutnya"
                onClick={() => setView(new Date(year, month + 1, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1 text-center text-[11px] font-medium text-muted">
                  {w}
                </div>
              ))}
              {cells.map((d, i) => {
                if (!d) return <div key={`e-${i}`} />;
                const isSelected = sameDay(d, value);
                const isToday = sameDay(d, today);
                return (
                  <button
                    key={toISODate(d)}
                    type="button"
                    onClick={() => pick(d)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex h-9 items-center justify-center rounded-btn text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isSelected
                        ? "bg-primary font-semibold text-surface hover:bg-primary-hover"
                        : "text-ink hover:bg-canvas",
                      !isSelected && isToday && "ring-1 ring-inset ring-primary"
                    )}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            {quickButtons && quickButtons.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                {quickButtons.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => applyQuick(q.days)}
                    className="rounded-btn border border-line px-2.5 py-1 text-xs font-medium text-ink-soft transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : helper ? (
        <p className="text-xs text-muted">{helper}</p>
      ) : null}
    </div>
  );
}
