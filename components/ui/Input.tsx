"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  leftAddon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helper, error, leftAddon, id, className, containerClassName, disabled, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    const describedBy = error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined;

    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="block text-[13px] font-medium text-ink">
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex h-10 items-center overflow-hidden rounded-input border bg-surface transition-colors focus-within:ring-2 focus-within:ring-offset-0",
            error ? "border-danger focus-within:ring-danger" : "border-line focus-within:border-primary focus-within:ring-primary",
            disabled && "bg-canvas opacity-60"
          )}
        >
          {leftAddon && <span className="pl-3 text-sm text-muted">{leftAddon}</span>}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn("h-full w-full bg-transparent px-3 text-sm text-ink placeholder:text-muted focus:outline-none disabled:cursor-not-allowed", className)}
            {...props}
          />
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-danger">
            {error}
          </p>
        ) : helper ? (
          <p id={`${inputId}-helper`} className="text-xs text-muted">
            {helper}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface CurrencyInputProps extends Omit<InputProps, "value" | "onChange" | "leftAddon" | "type"> {
  value: number | null;
  onValueChange: (value: number | null) => void;
}

/** Input nominal: menampilkan `Rp 1.500.000`, mengembalikan angka murni. */
export function CurrencyInput({ value, onValueChange, ...props }: CurrencyInputProps) {
  const display = value == null || Number.isNaN(value) ? "" : formatRupiah(value);
  return (
    <Input
      inputMode="numeric"
      leftAddon="Rp"
      value={display}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        onValueChange(digits ? parseInt(digits, 10) : null);
      }}
      className="font-mono tabular-nums"
      {...props}
    />
  );
}
