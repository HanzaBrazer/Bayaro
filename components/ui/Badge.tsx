import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "green" | "amber" | "red" | "blue";

const toneMap: Record<BadgeTone, string> = {
  neutral: "bg-canvas text-muted",
  green: "bg-primary-soft text-primary",
  amber: "bg-warning-soft text-warning",
  red: "bg-danger-soft text-danger",
  blue: "bg-info-soft text-info",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        toneMap[tone],
        className
      )}
      {...props}
    />
  );
}

export type InvoiceStatus = "draft" | "terkirim" | "lunas" | "jatuh_tempo";

const statusConfig: Record<InvoiceStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  terkirim: { label: "Terkirim", tone: "amber" },
  lunas: { label: "Lunas", tone: "green" },
  jatuh_tempo: { label: "Jatuh tempo", tone: "red" },
};

export function StatusBadge({ status, className }: { status: InvoiceStatus; className?: string }) {
  const { label, tone } = statusConfig[status];
  return (
    <Badge tone={tone} className={className}>
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "neutral" && "bg-muted",
          tone === "green" && "bg-primary",
          tone === "amber" && "bg-warning",
          tone === "red" && "bg-danger"
        )}
      />
      {label}
    </Badge>
  );
}
