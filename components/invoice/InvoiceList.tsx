"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Download,
  Image as ImageIcon,
  Link2,
  CheckCircle2,
  Trash2,
  FileText,
} from "lucide-react";
import {
  Card,
  Table,
  THead,
  TBody,
  TR,
  TD,
  TDNumber,
  SortableTH,
  TH,
  Pagination,
  StatusBadge,
  Dropdown,
  Modal,
  Button,
  IconButton,
  Input,
  Select,
  EmptyState,
  useToast,
  type InvoiceStatus,
} from "@/components/ui";
import { cn, formatRupiah, formatDateID } from "@/lib/utils";
import { updateInvoiceStatus, deleteInvoice, type InvoiceRow } from "@/lib/invoice/actions";
import { NewInvoiceButton } from "./NewInvoiceButton";

const STATUSES: { value: InvoiceStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "terkirim", label: "Terkirim" },
  { value: "lunas", label: "Lunas" },
  { value: "jatuh_tempo", label: "Jatuh tempo" },
];
const STATUS_FILTER = [{ value: "all", label: "Semua status" }, ...STATUSES];
const DATE_FILTER = [
  { value: "all", label: "Semua tanggal" },
  { value: "7", label: "7 hari terakhir" },
  { value: "30", label: "30 hari terakhir" },
  { value: "90", label: "90 hari terakhir" },
];
const PAGE_SIZE = 10;

type SortKey = "issue_date" | "total" | "number";

export function InvoiceList({ invoices, initialStatus = "all" }: { invoices: InvoiceRow[]; initialStatus?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState(initialStatus);
  const [datePreset, setDatePreset] = React.useState("all");
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "issue_date", dir: "desc" });
  const [page, setPage] = React.useState(1);
  const [deleteTarget, setDeleteTarget] = React.useState<InvoiceRow | null>(null);
  const [busy, setBusy] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const cutoff =
      datePreset === "all"
        ? null
        : (() => {
            const d = new Date();
            d.setDate(d.getDate() - Number(datePreset));
            return d.toISOString().slice(0, 10);
          })();
    const rows = invoices.filter((inv) => {
      if (q && !inv.number.toLowerCase().includes(q) && !(inv.client_name ?? "").toLowerCase().includes(q)) return false;
      if (status !== "all" && inv.status !== status) return false;
      if (cutoff && inv.issue_date < cutoff) return false;
      return true;
    });
    rows.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sort.key === "total") {
        av = a.total;
        bv = b.total;
      } else {
        av = a[sort.key];
        bv = b[sort.key];
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [invoices, query, status, datePreset, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  React.useEffect(() => setPage(1), [query, status, datePreset]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  const sortDir = (key: SortKey) => (sort.key === key ? sort.dir : false);

  async function changeStatus(id: string, next: InvoiceStatus) {
    setBusy(true);
    const res = await updateInvoiceStatus(id, next);
    setBusy(false);
    if (res.error) return toast.error("Gagal", res.error);
    toast.success("Status diperbarui");
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    const res = await deleteInvoice(deleteTarget.id);
    setBusy(false);
    if (res.error) return toast.error("Gagal", res.error);
    setDeleteTarget(null);
    toast.success("Invoice dihapus");
    router.refresh();
  }

  const itemCls =
    "flex w-full items-center gap-2.5 rounded-btn px-2.5 py-2 text-left text-sm text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  if (invoices.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="Belum ada invoice"
          description="Buat invoice pertamamu untuk mulai menagih klien."
          action={<NewInvoiceButton />}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input placeholder="Cari nomor / klien…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          <div className="w-40">
            <Select options={STATUS_FILTER} value={status} onChange={setStatus} />
          </div>
          <div className="w-44">
            <Select options={DATE_FILTER} value={datePreset} onChange={setDatePreset} />
          </div>
        </div>
        <NewInvoiceButton />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <THead>
            <tr>
              <SortableTH sorted={sortDir("number")} onSort={() => toggleSort("number")}>No.</SortableTH>
              <TH>Klien</TH>
              <SortableTH sorted={sortDir("issue_date")} onSort={() => toggleSort("issue_date")}>Tanggal</SortableTH>
              <SortableTH align="right" sorted={sortDir("total")} onSort={() => toggleSort("total")}>Total</SortableTH>
              <TH>Status</TH>
              <TH className="text-right">Aksi</TH>
            </tr>
          </THead>
          <TBody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">Tidak ada invoice yang cocok.</td>
              </tr>
            ) : (
              pageRows.map((inv) => (
                <TR key={inv.id} className="cursor-pointer" onClick={() => router.push(`/invoices/${inv.id}/edit`)}>
                  <TD className="font-mono text-ink-soft">{inv.number}</TD>
                  <TD className="font-medium">{inv.client_name || "—"}</TD>
                  <TD className="text-muted">{formatDateID(inv.issue_date)}</TD>
                  <TDNumber>Rp {formatRupiah(inv.total)}</TDNumber>
                  <TD onClick={(e) => e.stopPropagation()}>
                    <Dropdown
                      portal
                      trigger={({ toggle }) => (
                        <button type="button" onClick={toggle} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                          <StatusBadge status={inv.status as InvoiceStatus} />
                        </button>
                      )}
                    >
                      {(close) =>
                        STATUSES.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              close();
                              changeStatus(inv.id, s.value);
                            }}
                            className={itemCls}
                          >
                            <StatusBadge status={s.value} />
                          </button>
                        ))
                      }
                    </Dropdown>
                  </TD>
                  <TD className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Dropdown
                      portal
                      align="right"
                      trigger={({ toggle }) => (
                        <IconButton aria-label={`Aksi ${inv.number}`} size="sm" onClick={toggle}>
                          <MoreHorizontal className="h-4 w-4" />
                        </IconButton>
                      )}
                    >
                      {(close) => (
                        <>
                          <a href={`/i/${inv.public_token}`} target="_blank" rel="noopener" onClick={() => setTimeout(close, 0)} className={itemCls}>
                            <Eye className="h-4 w-4" /> Lihat
                          </a>
                          <Link href={`/invoices/${inv.id}/edit`} onClick={close} className={itemCls}>
                            <Pencil className="h-4 w-4" /> Edit
                          </Link>
                          <a href={`/api/i/${inv.public_token}/pdf`} target="_blank" rel="noopener" onClick={() => setTimeout(close, 0)} className={itemCls}>
                            <Download className="h-4 w-4" /> Unduh PDF
                          </a>
                          <a href={`/api/i/${inv.public_token}/png`} target="_blank" rel="noopener" onClick={() => setTimeout(close, 0)} className={itemCls}>
                            <ImageIcon className="h-4 w-4" /> Unduh PNG
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(`${window.location.origin}/i/${inv.public_token}`);
                              toast.success("Link disalin");
                              close();
                            }}
                            className={itemCls}
                          >
                            <Link2 className="h-4 w-4" /> Salin link
                          </button>
                          {inv.status !== "lunas" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                close();
                                changeStatus(inv.id, "lunas");
                              }}
                              className={itemCls}
                            >
                              <CheckCircle2 className="h-4 w-4 text-primary" /> Tandai Lunas
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              close();
                              setDeleteTarget(inv);
                            }}
                            className={cn(itemCls, "text-danger hover:bg-danger-soft")}
                          >
                            <Trash2 className="h-4 w-4" /> Hapus
                          </button>
                        </>
                      )}
                    </Dropdown>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        size="sm"
        title="Hapus invoice?"
        description={`Invoice ${deleteTarget?.number ?? ""} akan dihapus permanen.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={busy}>Batal</Button>
            <Button variant="primary" className="bg-danger hover:bg-danger/90" loading={busy} onClick={confirmDelete}>Ya, hapus</Button>
          </>
        }
      />
    </div>
  );
}
