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
  /** Label pengganti selama loading, mis. "Menyimpan…". Kosong = label tetap. */
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Pembungkus ikon yang lebarnya bisa menyusut ke nol.
 *
 * Dipakai supaya pergantian ikon → spinner tidak membuat tombol melompat:
 * bila tombol punya leftIcon, ikon menyusut tepat saat spinner melebar, jadi
 * lebar total tidak berubah. Bila tidak punya ikon, spinner melebar mulus
 * dalam 200ms — terbaca sebagai animasi, bukan kedutan.
 */
function Slot({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <span
      aria-hidden={!show || undefined}
      className={cn(
        "inline-flex shrink-0 items-center overflow-hidden transition-[width,margin] duration-200 motion-reduce:transition-none",
        // -mr-2 menetralkan gap-2 milik tombol saat slot menyusut, supaya slot
        // yang tersembunyi tidak menyisakan ruang kosong.
        show ? "w-4" : "w-0 -mr-2"
      )}
    >
      {children}
    </span>
  );
}

/**
 * Spinner tombol. motion-reduce: berhenti berputar dan cukup berdenyut halus,
 * supaya tetap terbaca sebagai "sedang berjalan" tanpa gerakan memutar.
 */
function ButtonSpinner() {
  return (
    <Loader2
      className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-pulse motion-reduce:[animation-duration:1.5s]"
      aria-hidden
    />
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Label harus tetap terbaca selama loading: pengguna perlu tahu aksi apa
    // yang sedang berjalan. Spinner menggantikan leftIcon supaya lebar tombol
    // tidak berubah dan tata letak di sekitarnya tidak melompat.
    return (
      <button
        ref={ref}
        className={cn(
          base,
          variantMap[variant],
          sizeMap[size],
          // Sedang bekerja ≠ tidak bisa dipakai: jangan sepudar disabled biasa.
          loading && "cursor-wait opacity-85 disabled:cursor-wait disabled:opacity-85",
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        <Slot show={loading}>
          <ButtonSpinner />
        </Slot>
        {leftIcon && <Slot show={!loading}>{leftIcon}</Slot>}
        {loadingText && loading ? loadingText : children}
        {rightIcon}
        {loading && <span className="sr-only">Sedang memproses</span>}
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
