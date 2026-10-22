import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-btn font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none";

const variantMap: Record<ButtonVariant, string> = {
  primary: "bg-primary text-surface hover:bg-primary-hover active:bg-primary-hover shadow-sm",
  secondary: "border border-line bg-surface text-ink hover:bg-canvas active:bg-canvas",
  ghost: "bg-transparent text-ink-soft hover:bg-canvas active:bg-canvas",
  danger: "bg-transparent text-danger hover:bg-danger-soft active:bg-danger-soft",
};

const sizeMap: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading = false, leftIcon, rightIcon, className, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(base, variantMap[variant], sizeMap[size], "relative", className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <Loader2 className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin" aria-hidden />
        )}
        <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>
          {leftIcon}
          {children}
          {rightIcon}
        </span>
      </button>
    );
  }
);
Button.displayName = "Button";

type IconButtonVariant = ButtonVariant;
type IconButtonSize = "sm" | "md";

const iconSizeMap: Record<IconButtonSize, string> = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Wajib untuk aksesibilitas (ikon telanjang tanpa teks). */
  "aria-label": string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "ghost", size = "md", className, children, title, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        title={title ?? props["aria-label"]}
        className={cn(base, variantMap[variant], iconSizeMap[size], "p-0", className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";
