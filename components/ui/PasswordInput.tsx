"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  showStrength?: boolean;
  containerClassName?: string;
}

function strengthOf(value: string): { score: number; label: string } {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  const label = value.length === 0 ? "" : score <= 1 ? "Lemah" : score <= 3 ? "Cukup" : "Kuat";
  return { score, label };
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, helper, error, showStrength, id, className, containerClassName, value, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    const [show, setShow] = React.useState(false);
    const strength = showStrength ? strengthOf(String(value ?? "")) : null;

    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="block text-[13px] font-medium text-ink">
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex h-10 items-center overflow-hidden rounded-input border bg-surface transition-colors focus-within:ring-2",
            error ? "border-danger focus-within:ring-danger" : "border-line focus-within:border-primary focus-within:ring-primary"
          )}
        >
          <input
            ref={ref}
            id={inputId}
            type={show ? "text" : "password"}
            value={value}
            aria-invalid={error ? true : undefined}
            className={cn("h-full w-full bg-transparent px-3 text-sm text-ink placeholder:text-muted focus:outline-none", className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
            className="flex h-full w-10 shrink-0 items-center justify-center text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {strength && strength.label && (
          <div className="flex items-center gap-2">
            <div className="flex h-1 flex-1 gap-1" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    i < strength.score
                      ? strength.score <= 1
                        ? "bg-danger"
                        : strength.score <= 3
                          ? "bg-warning"
                          : "bg-primary"
                      : "bg-line"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted">{strength.label}</span>
          </div>
        )}

        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : helper ? (
          <p className="text-xs text-muted">{helper}</p>
        ) : null}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
