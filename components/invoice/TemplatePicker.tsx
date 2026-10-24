"use client";

import * as React from "react";
import { Check, LayoutTemplate } from "lucide-react";
import { Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import { TEMPLATES, getTemplate } from "./templates/registry";
import type { TemplateProps } from "./templates/types";

/**
 * Pemilih template berbentuk pop-up: pengisi invoice bisa melihat
 * pratinjau nyata tiap template (memakai data invoice saat ini) sebelum memilih.
 */
export function TemplatePicker({
  workspace,
  values,
  totals,
  value,
  onChange,
}: {
  workspace: TemplateProps["workspace"];
  values: TemplateProps["values"];
  totals: TemplateProps["totals"];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const current = getTemplate(value);

  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-ink">Template</label>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="flex h-10 w-full items-center justify-between gap-2 rounded-input border border-line bg-surface px-3 text-sm transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-muted" />
          <span className="font-medium text-ink">{current.name}</span>
        </span>
        <span className="text-xs font-medium text-primary">Ubah</span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title="Pilih template"
        description="Lihat tampilan tiap template dengan data invoice-mu, lalu pilih."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const Comp = t.component;
            const selected = t.id === value;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onChange(t.id);
                  setOpen(false);
                }}
                aria-pressed={selected}
                className={cn(
                  "group overflow-hidden rounded-card border bg-white text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  selected ? "border-primary ring-2 ring-primary" : "border-line hover:border-primary"
                )}
              >
                <div className="relative h-48 overflow-hidden border-b border-line bg-white">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <div style={{ zoom: 0.34 } as any} className="pointer-events-none origin-top-left">
                    <Comp workspace={workspace} values={values} totals={totals} />
                  </div>
                  {selected && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-surface shadow-card">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-muted">{t.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
