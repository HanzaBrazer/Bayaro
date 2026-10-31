"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Copy, Trash2, LayoutTemplate, ImageIcon } from "lucide-react";
import { Card, Button, Modal, Badge, EmptyState, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { CustomTemplate } from "@/components/invoice/templates/CustomTemplate";
import { STARTERS, STARTER_KEYS, customTemplateId, type StarterKey } from "@/lib/custom-template/schema";
import { SAMPLE_VALUES, SAMPLE_TOTALS } from "@/lib/custom-template/sample";
import {
  createCustomTemplate,
  duplicateCustomTemplate,
  countTemplateUsage,
  deleteCustomTemplate,
} from "@/lib/custom-template/actions";
import { setDefaultTemplate } from "@/lib/workspace/actions";
import type { CustomTemplateSummary } from "@/lib/custom-template/types";
import type { WorkspaceInfo } from "@/lib/invoice/types";

function updatedLabel(iso: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export function CustomTemplateList({
  workspace,
  templates,
  defaultTemplateId,
}: {
  workspace: WorkspaceInfo;
  templates: CustomTemplateSummary[];
  defaultTemplateId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [creating, setCreating] = React.useState<StarterKey | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [toDelete, setToDelete] = React.useState<{ t: CustomTemplateSummary; usage: number } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function create(key: StarterKey) {
    if (creating) return;
    setCreating(key);
    try {
      const res = await createCustomTemplate(key);
      if (res.error || !res.id) return toast.error("Gagal membuat template", res.error ?? "Coba lagi.");
      toast.success("Template dibuat", "Susun sesukamu di builder.");
      router.push(`/templates/custom/${res.id}`);
    } catch {
      toast.error("Gagal membuat template", "Jaringan bermasalah. Coba lagi.");
    } finally {
      setCreating(null);
    }
  }

  async function makeDefault(t: CustomTemplateSummary) {
    if (busyId) return;
    setBusyId(t.id);
    try {
      const res = await setDefaultTemplate(customTemplateId(t.id));
      if (res.error) return toast.error("Gagal", res.error);
      toast.success("Template default diubah", `Invoice baru memakai "${t.name}".`);
      router.refresh();
    } catch {
      toast.error("Gagal", "Jaringan bermasalah. Coba lagi.");
    } finally {
      setBusyId(null);
    }
  }

  async function duplicate(t: CustomTemplateSummary) {
    if (busyId) return;
    setBusyId(t.id);
    try {
      const res = await duplicateCustomTemplate(t.id);
      if (res.error) return toast.error("Gagal menduplikat", res.error);
      toast.success("Template diduplikat");
      router.refresh();
    } catch {
      toast.error("Gagal menduplikat", "Jaringan bermasalah. Coba lagi.");
    } finally {
      setBusyId(null);
    }
  }

  async function askDelete(t: CustomTemplateSummary) {
    if (busyId) return;
    setBusyId(t.id);
    try {
      const usage = await countTemplateUsage(t.id);
      setToDelete({ t, usage });
    } catch {
      toast.error("Gagal memeriksa pemakaian template", "Coba lagi.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete || deleting) return;
    setDeleting(true);
    try {
      const res = await deleteCustomTemplate(toDelete.t.id);
      if (res.error) return toast.error("Gagal menghapus", res.error);
      toast.success(
        "Template dihapus",
        res.moved ? `${res.moved} invoice dialihkan ke template Jasa.` : undefined
      );
      setToDelete(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghapus", "Jaringan bermasalah. Coba lagi.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Template kustom</h2>
          <p className="text-sm text-muted">Susun template sendiri dari blok, atau pasang kop surat usahamu.</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setPickerOpen(true)}>
          Buat template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <EmptyState
            icon={<LayoutTemplate className="h-6 w-6" />}
            title="Belum ada template kustom"
            description="Mulai dari layout dasar, lalu ubah sesukamu."
            action={<Button onClick={() => setPickerOpen(true)}>Buat template pertama</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink" title={t.name}>{t.name}</p>
                  <p className="text-xs text-muted">Diubah {updatedLabel(t.updatedAt)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {customTemplateId(t.id) === defaultTemplateId && <Badge tone="green">Default</Badge>}
                  {t.hasLetterhead && (
                    <Badge tone="neutral">
                      <ImageIcon className="h-3 w-3" /> Kop surat
                    </Badge>
                  )}
                </div>
              </div>
              {customTemplateId(t.id) !== defaultTemplateId && (
                <button
                  type="button"
                  onClick={() => makeDefault(t)}
                  disabled={busyId !== null}
                  className="self-start text-xs font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                >
                  Jadikan default
                </button>
              )}
              <div className="mt-auto flex gap-2">
                <Link
                  href={`/templates/custom/${t.id}`}
                  className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-btn bg-primary px-3 text-xs font-medium text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => duplicate(t)}
                  loading={busyId === t.id && !toDelete}
                  disabled={busyId !== null && busyId !== t.id}
                  aria-label={`Duplikat ${t.name}`}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-danger hover:bg-danger-soft"
                  onClick={() => askDelete(t)}
                  disabled={busyId !== null}
                  aria-label={`Hapus ${t.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pilih titik awal */}
      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        size="lg"
        title="Pilih titik awal"
        description="Semua bisa diubah lagi di builder — ini hanya susunan awal."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STARTER_KEYS.map((key) => {
            const st = STARTERS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => create(key)}
                disabled={creating !== null}
                className={cn(
                  "group overflow-hidden rounded-card border border-line bg-surface text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60",
                  creating === key && "border-primary"
                )}
              >
                <div className="pointer-events-none h-40 overflow-hidden border-b border-line bg-white">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <div style={{ zoom: 0.3 } as any}>
                    <CustomTemplate layout={st.layout} workspace={workspace} values={SAMPLE_VALUES} totals={SAMPLE_TOTALS} />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-ink">
                    {st.name}
                    {creating === key && <span className="ml-1 text-xs font-normal text-muted">membuat…</span>}
                  </p>
                  <p className="text-xs text-muted">{st.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Konfirmasi hapus — menyebut jumlah invoice terdampak */}
      <Modal
        open={toDelete !== null}
        onClose={() => !deleting && setToDelete(null)}
        size="sm"
        title="Hapus template?"
        description={
          toDelete
            ? toDelete.usage > 0
              ? `"${toDelete.t.name}" dipakai ${toDelete.usage} invoice. Invoice tersebut akan dialihkan ke template Jasa — isinya tidak hilang.`
              : `"${toDelete.t.name}" akan dihapus permanen.`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)} disabled={deleting}>Batal</Button>
            <Button className="bg-danger hover:bg-danger/90" loading={deleting} onClick={confirmDelete}>
              Ya, hapus
            </Button>
          </>
        }
      />
    </section>
  );
}
