import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./Card";

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  trend?: { value: string; direction: "up" | "down" };
  hint?: string;
  className?: string;
}

export function StatCard({ icon, label, value, trend, hint, className }: StatCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-btn bg-primary-soft text-primary">
          {icon}
        </span>
        <p className="text-[13px] font-medium text-muted">{label}</p>
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="font-sans text-[32px] font-bold leading-[40px] tracking-tight text-ink tabular-nums">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              trend.direction === "up" ? "bg-primary-soft text-primary" : "bg-danger-soft text-danger"
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}
