"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    return (
      <div className="space-y-1">
        <label htmlFor={inputId} className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-line accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              className
            )}
            {...props}
          />
          {label && <span className="select-none">{label}</span>}
        </label>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
