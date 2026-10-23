"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FileText, Eye, ChevronDown, Download, Image as ImageIcon, Link2 } from "lucide-react";
import {
  Input,
  CurrencyInput,
  Textarea,
  Select,
  DatePicker,
  Button,
  IconButton,
  Modal,
  Card,
  Dropdown,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { computeTotals, lineTotal } from "@/lib/invoice/calc";
import { createInvoice, updateInvoice } from "@/lib/invoice/actions";
import {
  CATEGORY_LABEL,
  CATEGORY_COLOR,
  type InvoiceFormValues,
  type InvoiceItemInput,
  type ItemCategory,
  type WorkspaceInfo,
} from "@/lib/invoice/types";
import { formatRupiah } from "@/lib/utils";
import { getTemplate, TEMPLATES } from "./templates/registry";
import { ClientDrawer } from "@/components/client/ClientDrawer";
import type { ClientRecord } from "@/lib/client/actions";

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABEL) as ItemCategory[]).map((c) => ({
  value: c,
  label: CATEGORY_LABEL[c],
  colorDot: CATEGORY_COLOR[c],
}));

const TEMPLATE_OPTIONS = TEMPLATES.map((t) => ({ value: t.id, label: t.name }));

function toDate(s: string | null): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function fromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function newItem(): InvoiceItemInput {
  return { key: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, category: "jasa" };
}

export function InvoiceEditor({
  workspace,
  initialValues,
  mode,
  invoiceId,
  publicToken,
  clients,
}: {
  workspace: WorkspaceInfo;
  initialValues: InvoiceFormValues;
  mode: "new" | "edit";
  invoiceId?: string;
  publicToken?: string | null;
  clients: ClientRecord[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = React.useState<InvoiceFormValues>(initialValues);
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState<null | "draft" | "final">(null);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"form" | "preview">("form");
  const [clientList, setClientList] = React.useState<ClientRecord[]>(clients);
  const [clientDrawerOpen, setClientDrawerOpen] = React.useState(false);

  const clientOptions = React.useMemo(() => clientList.map((c) => ({ value: c.id, label: c.name })), [clientList]);

  function selectClient(id: string) {
    const c = clientList.find((x) => x.id === id);
    if (c) patch({ clientId: c.id, clientName: c.name, clientAddress: c.address ?? "" });
  }

  const totals = React.useMemo(
    () => computeTotals(values.items, values.taxPercent, values.discount),
    [values.items, values.taxPercent, values.discount]
  );

  function patch(p: Partial<InvoiceFormValues>) {
    setValues((v) => ({ ...v, ...p }));
    setDirty(true);
  }
  function patchItem(key: string, p: Partial<InvoiceItemInput>) {
    setValues((v) => ({ ...v, items: v.items.map((it) => (it.key === key ? { ...it, ...p } : it)) }));
    setDirty(true);
  }
  function addItem() {
    setValues((v) => ({ ...v, items: [...v.items, newItem()] }));
    setDirty(true);
  }
  function removeItem(key: string) {
    setValues((v) => ({ ...v, items: v.items.filter((it) => it.key !== key) }));
    setDirty(true);
  }

  async function save(asDraft: boolean) {
    setSaving(asDraft ? "draft" : "final");
    const res = mode === "edit" && invoiceId
      ? await updateInvoice(invoiceId, values, asDraft)
      : await createInvoice(values, asDraft);
    setSaving(null);
    if (res.error) {
      toast.error("Gagal menyimpan", res.error);
      return;
    }
    setDirty(false);
    toast.success(asDraft ? "Draft tersimpan" : "Invoice tersimpan");
    router.push("/invoices");
    router.refresh();
  }

  function handleCancel() {
    if (dirty) setCancelOpen(true);
    else router.push("/invoices");
  }

  return (
    <div className="space-y-4">
      {/* Tabs (mobile/tablet) */}
      <div className="flex gap-1 rounded-btn border border-line bg-surface p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setTab("form")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-btn py-1.5 text-sm font-medium transition-colors",
            tab === "form" ? "bg-primary-soft text-primary" : "text-muted"
          )}
        >
          <FileText className="h-4 w-4" /> Form
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-btn py-1.5 text-sm font-medium transition-colors",
            tab === "preview" ? "bg-primary-soft text-primary" : "text-muted"
          )}
        >
          <Eye className="h-4 w-4" /> Preview
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-6 lg:items-start">
        {/* FORM */}
        <div className={cn("space-y-4", tab !== "form" && "hidden lg:block")}>
          <Card className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Template" options={TEMPLATE_OPTIONS} value={values.templateId} onChange={(v) => patch({ templateId: v })} />
              <Input
                label="Nomor invoice"
                value={values.number}
                onChange={(e) => patch({ number: e.target.value })}
                helper="Otomatis berurutan; bisa diubah."
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-ink">Klien</label>
                <button type="button" onClick={() => setClientDrawerOpen(true)} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:underline">
                  <Plus className="h-3.5 w-3.5" /> Klien baru
                </button>
              </div>
              <Select options={clientOptions} value={values.clientId} onChange={selectClient} placeholder="Pilih klien…" />
              {!values.clientId && values.clientName && (
                <p className="text-xs text-muted">Klien saat ini: <span className="text-ink">{values.clientName}</span> — pilih/buat untuk menautkan.</p>
              )}
              {clientList.length === 0 && (
                <p className="text-xs text-muted">Belum ada klien. Klik “Klien baru”.</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <DatePicker label="Tanggal terbit" value={toDate(values.issueDate)} onChange={(d) => patch({ issueDate: fromDate(d) })} />
              <DatePicker
                label="Jatuh tempo"
                value={toDate(values.dueDate)}
                onChange={(d) => patch({ dueDate: fromDate(d) })}
                quickButtons={[
                  { label: "+14 hari", days: 14 },
                  { label: "+30 hari", days: 30 },
                ]}
              />
            </div>
          </Card>

          {/* Items */}
          <Card className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Item</h3>
              <Button size="sm" variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={addItem}>
                Tambah item
              </Button>
            </div>

            {values.items.length === 0 && <p className="py-4 text-center text-sm text-muted">Belum ada item. Tambah item pertama.</p>}

            <div className="space-y-3">
              {values.items.map((it) => (
                <div key={it.key} className="rounded-btn border border-line p-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_72px_120px_auto]">
                    <Input placeholder="Deskripsi" value={it.description} onChange={(e) => patchItem(it.key, { description: e.target.value })} containerClassName="sm:col-span-1" />
                    <Input type="number" min={0} placeholder="Qty" value={String(it.quantity)} onChange={(e) => patchItem(it.key, { quantity: Number(e.target.value) || 0 })} />
                    <CurrencyInput value={it.unit_price} onValueChange={(v) => patchItem(it.key, { unit_price: v ?? 0 })} />
                    <div className="flex items-center justify-end">
                      <IconButton aria-label="Hapus item" variant="danger" onClick={() => removeItem(it.key)}>
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="w-44">
                      <Select options={CATEGORY_OPTIONS} value={it.category} onChange={(v) => patchItem(it.key, { category: v as ItemCategory })} />
                    </div>
                    <span className="font-mono text-sm tabular-nums text-ink">Rp {formatRupiah(lineTotal(it.quantity, it.unit_price))}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pajak / diskon / catatan */}
          <Card className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Pajak (%)"
                type="number"
                min={0}
                value={String(values.taxPercent)}
                onChange={(e) => patch({ taxPercent: Number(e.target.value) || 0 })}
              />
              <CurrencyInput label="Diskon (Rp)" value={values.discount || null} onValueChange={(v) => patch({ discount: v ?? 0 })} />
            </div>
            <Textarea label="Catatan" value={values.notes} onChange={(e) => patch({ notes: e.target.value })} rows={2} placeholder="Termin pembayaran, ucapan terima kasih…" />

            <div className="space-y-1 rounded-btn bg-canvas p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="font-mono tabular-nums">Rp {formatRupiah(totals.subtotal)}</span></div>
              {totals.discount > 0 && <div className="flex justify-between"><span className="text-muted">Diskon</span><span className="font-mono tabular-nums text-danger">− Rp {formatRupiah(totals.discount)}</span></div>}
              {totals.tax > 0 && <div className="flex justify-between"><span className="text-muted">Pajak</span><span className="font-mono tabular-nums">Rp {formatRupiah(totals.tax)}</span></div>}
              <div className="flex justify-between border-t border-line pt-1 font-semibold"><span>Total</span><span className="font-mono tabular-nums text-primary">Rp {formatRupiah(totals.total)}</span></div>
            </div>
          </Card>

          {/* Actions */}
          <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 rounded-card border border-line bg-surface/90 p-3 shadow-card backdrop-blur">
            {publicToken && (
              <div className="mr-auto">
                <Dropdown
                  portal
                  align="left"
                  trigger={({ open, toggle }) => (
                    <Button variant="secondary" onClick={toggle} rightIcon={<ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />}>
                      Export
                    </Button>
                  )}
                >
                  {(close) => {
                    const item = "flex w-full items-center gap-2.5 rounded-btn px-2.5 py-2 text-left text-sm text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
                    return (
                      <>
                        <a href={`/api/i/${publicToken}/pdf`} target="_blank" rel="noopener" onClick={close} className={item}>
                          <Download className="h-4 w-4" /> Unduh PDF
                        </a>
                        <a href={`/api/i/${publicToken}/png`} target="_blank" rel="noopener" onClick={close} className={item}>
                          <ImageIcon className="h-4 w-4" /> Unduh PNG
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(`${window.location.origin}/i/${publicToken}`);
                            toast.success("Link disalin", "URL publik disalin ke clipboard.");
                            close();
                          }}
                          className={item}
                        >
                          <Link2 className="h-4 w-4" /> Salin link
                        </button>
                      </>
                    );
                  }}
                </Dropdown>
              </div>
            )}
            <Button variant="ghost" onClick={handleCancel} disabled={saving !== null}>Batal</Button>
            <Button variant="secondary" onClick={() => save(true)} loading={saving === "draft"} disabled={saving === "final"}>Simpan draft</Button>
            <Button onClick={() => save(false)} loading={saving === "final"} disabled={saving === "draft"}>Simpan</Button>
          </div>
        </div>

        {/* PREVIEW */}
        <div className={cn("lg:sticky lg:top-20", tab !== "preview" && "hidden lg:block")}>
          <div className="overflow-hidden rounded-card border border-line bg-canvas p-3 shadow-card">
            <div className="max-h-[calc(100vh-7rem)] overflow-auto">
              {(() => {
                const PreviewTemplate = getTemplate(values.templateId).component;
                return <PreviewTemplate workspace={workspace} values={values} totals={totals} />;
              })()}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        size="sm"
        title="Batalkan perubahan?"
        description="Perubahan yang belum disimpan akan hilang."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>Lanjut mengisi</Button>
            <Button variant="primary" className="bg-danger hover:bg-danger/90" onClick={() => router.push("/invoices")}>Ya, batalkan</Button>
          </>
        }
      />

      <ClientDrawer
        open={clientDrawerOpen}
        onClose={() => setClientDrawerOpen(false)}
        onSaved={(c) => {
          setClientList((prev) => [...prev.filter((x) => x.id !== c.id), c].sort((a, b) => a.name.localeCompare(b.name)));
          patch({ clientId: c.id, clientName: c.name, clientAddress: c.address ?? "" });
        }}
      />
    </div>
  );
}
