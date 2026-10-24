"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Eye } from "lucide-react";
import { Card, Button, Badge, Modal, useToast } from "@/components/ui";
import { computeTotals } from "@/lib/invoice/calc";
import { setDefaultTemplate } from "@/lib/workspace/actions";
import { TEMPLATES, getTemplate, type TemplateMeta } from "@/components/invoice/templates/registry";
import type { InvoiceFormValues, WorkspaceInfo } from "@/lib/invoice/types";

function sampleValues(templateId: string): InvoiceFormValues {
  return {
    clientId: null,
    clientName: "PT Contoh Klien",
    clientAddress: "Jl. Merdeka No. 1, Jakarta",
    clientEmail: "halo@contohklien.com",
    clientPhone: "0812-3456-7890",
    number: "INV-0001",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: null,
    items: [
      { key: "1", description: "Jasa desain brand", quantity: 1, unit_price: 3500000, category: "jasa" },
      { key: "2", description: "Revisi tambahan", quantity: 2, unit_price: 500000, category: "jasa" },
    ],
    taxPercent: 11,
    discount: 0,
    notes: "Terima kasih atas kepercayaannya.",
    terms: "Pembayaran paling lambat 14 hari setelah invoice diterbitkan.",
    templateId,
  };
}

export function TemplateGallery({
  workspace,
  defaultTemplateId,
}: {
  workspace: WorkspaceInfo;
  defaultTemplateId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [preview, setPreview] = React.useState<TemplateMeta | null>(null);
  const [savingId, setSavingId] = React.useState<string | null>(null);

  async function makeDefault(id: string) {
    setSavingId(id);
    const res = await setDefaultTemplate(id);
    setSavingId(null);
    if (res.error) return toast.error("Gagal", res.error);
    toast.success("Template default diubah");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Pilih tampilan invoice. Template default dipakai saat membuat invoice baru.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => {
          const isDefault = t.id === defaultTemplateId;
          const values = sampleValues(t.id);
          const totals = computeTotals(values.items, values.taxPercent, values.discount);
          const Comp = t.component;
          return (
            <Card key={t.id} className="overflow-hidden">
              <div className="relative h-44 overflow-hidden border-b border-line bg-white">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <div style={{ zoom: 0.3 } as any}>
                  <Comp workspace={workspace} values={values} totals={totals} />
                </div>
                {isDefault && (
                  <span className="absolute right-2 top-2">
                    <Badge tone="green">
                      <Check className="h-3 w-3" /> Default
                    </Badge>
                  </span>
                )}
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-ink">{t.name}</h3>
                  <p className="text-xs text-muted">{t.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" leftIcon={<Eye className="h-4 w-4" />} onClick={() => setPreview(t)} className="flex-1">
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => makeDefault(t.id)}
                    loading={savingId === t.id}
                    disabled={isDefault}
                    className="flex-1"
                  >
                    {isDefault ? "Default" : "Jadikan default"}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={preview !== null} onClose={() => setPreview(null)} size="lg" title={preview ? `Template ${preview.name}` : ""}>
        {preview && (
          <div className="max-h-[70vh] overflow-auto rounded-card border border-line bg-white">
            {(() => {
              const values = sampleValues(preview.id);
              const totals = computeTotals(values.items, values.taxPercent, values.discount);
              const Comp = getTemplate(preview.id).component;
              return (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <div style={{ zoom: 0.62 } as any}>
                  <Comp workspace={workspace} values={values} totals={totals} />
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
