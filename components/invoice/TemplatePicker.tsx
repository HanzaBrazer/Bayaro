"use client";

import * as React from "react";
import { Check, LayoutTemplate } from "lucide-react";
import { Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { TEMPLATES } from "./templates/registry";
import { InvoiceDocument, templateLabel, toCustomMap } from "./templates/InvoiceDocument";
import { CUSTOM_PREFIX } from "@/lib/custom-template/schema";
import type { CustomTemplateRecord } from "@/lib/custom-template/types";
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
  customTemplates = [],
}: {
  workspace: TemplateProps["workspace"];
  values: TemplateProps["values"];
  totals: TemplateProps["totals"];
  value: string;
  onChange: (id: string) => void;
  customTemplates?: CustomTemplateRecord[];
}) {
  const [open, setOpen] = React.useState(false);
  const customs = React.useMemo(() => toCustomMap(customTemplates), [customTemplates]);
  const currentName = templateLabel(value, customs);

  const card = (id: string, name: string, description: React.ReactNode, editHref?: string) => {
    const selected = id === value;
    return (
      <div
        key={id}
        className={cn(
          "group overflow-hidden rounded-card border bg-white transition-all",
          selected ? "border-primary ring-2 ring-primary" : "border-line hover:border-primary"
        )}
      >
        <button
          type="button"
          onClick={() => {
            onChange(id);
            setOpen(false);
          }}
          aria-pressed={selected}
          className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="relative h-48 overflow-hidden border-b border-line bg-white">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <div style={{ zoom: 0.34 } as any} className="pointer-events-none origin-top-left">
              <InvoiceDocument templateId={id} customs={customs} workspace={workspace} values={values} totals={totals} />
            </div>
            {selected && (
              <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-surface shadow-card">
                <Check className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
          <div className="px-3 pb-2 pt-3">
            <p className="text-sm font-semibold text-ink">{name}</p>
            <p className="text-xs text-muted">{description}</p>
          </div>
        </button>
        {editHref && (
          <div className="px-3 pb-3">
            <Link
              href={editHref}
              className="inline-flex text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Edit desain
            </Link>
          </div>
        )}
      </div>
    );
  };

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
          <span className="font-medium text-ink">{currentName}</span>
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
          {TEMPLATES.map((t) => card(t.id, t.name, t.description))}
        </div>

        {customTemplates.length > 0 && (
          <>
            <p className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-wider text-muted">Template kustom</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {customTemplates.map((t) =>
                card(
                  `${CUSTOM_PREFIX}${t.id}`,
                  t.name,
                  t.letterheadUrl ? "Pakai kop surat." : "Dibuat di builder blok.",
                  `/templates/custom/${t.id}`
                )
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
