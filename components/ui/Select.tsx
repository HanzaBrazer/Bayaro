"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  /** Warna titik (mis. kategori), hex. */
  colorDot?: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  helper?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Pilih…",
  label,
  helper,
  error,
  disabled,
  id,
  className,
}: SelectProps) {
  const reactId = React.useId();
  const selectId = id ?? reactId;
  const listboxId = `${selectId}-listbox`;
  const [open, setOpen] = React.useState(false);
  const [highlight, setHighlight] = React.useState<number>(-1);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const close = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    if (!open) return;
    const selectedIndex = options.findIndex((o) => o.value === value);
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
    const onDocDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open, options, value, close]);

  const pick = (opt: SelectOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    close();
  };

  const moveHighlight = (dir: 1 | -1) => {
    setHighlight((h) => {
      let next = h;
      for (let i = 0; i < options.length; i++) {
        next = (next + dir + options.length) % options.length;
        if (!options[next]?.disabled) break;
      }
      return next;
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveHighlight(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveHighlight(-1);
        break;
      case "Home":
        e.preventDefault();
        setHighlight(0);
        break;
      case "End":
        e.preventDefault();
        setHighlight(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (options[highlight]) pick(options[highlight]);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close();
        break;
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={selectId} className="block text-[13px] font-medium text-ink">
          {label}
        </label>
      )}
      <div ref={rootRef} className="relative">
        <button
          type="button"
          id={selectId}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={onKeyDown}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-input border bg-surface px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-canvas disabled:opacity-60",
            error
              ? "border-danger focus-visible:ring-danger"
              : "border-line focus-visible:border-primary focus-visible:ring-primary",
            open && !error && "border-primary ring-2 ring-primary"
          )}
        >
          <span className={cn("flex items-center gap-2 truncate", !selected && "text-muted")}>
            {selected?.colorDot && (
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: selected.colorDot }} />
            )}
            {selected?.icon}
            <span className="truncate">{selected ? selected.label : placeholder}</span>
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-muted transition-transform motion-reduce:transition-none", open && "rotate-180")}
          />
        </button>

        {open && (
          <ul
            id={listboxId}
            role="listbox"
            aria-labelledby={selectId}
            className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-card border border-line bg-surface p-1 shadow-dropdown"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              const isHighlighted = i === highlight;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(opt)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-btn px-2.5 py-2 text-sm text-ink",
                    isHighlighted && !opt.disabled && "bg-canvas",
                    opt.disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    {opt.colorDot && (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: opt.colorDot }} />
                    )}
                    {opt.icon}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </li>
              );
            })}
          </ul>
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
