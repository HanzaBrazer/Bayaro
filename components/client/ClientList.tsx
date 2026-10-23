"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import {
  Card,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Dropdown,
  Modal,
  Button,
  IconButton,
  Input,
  EmptyState,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { deleteClientRecord, type ClientRecord } from "@/lib/client/actions";
import { ClientDrawer } from "./ClientDrawer";

export function ClientList({ clients }: { clients: ClientRecord[] }) {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<ClientRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ClientRecord | null>(null);
  const [busy, setBusy] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q) || (c.phone ?? "").toLowerCase().includes(q)
    );
  }, [clients, query]);

  function openNew() {
    setEditTarget(null);
    setDrawerOpen(true);
  }
  function openEdit(c: ClientRecord) {
    setEditTarget(c);
    setDrawerOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    const res = await deleteClientRecord(deleteTarget.id);
    setBusy(false);
    if (res.error) return toast.error("Gagal", res.error);
    setDeleteTarget(null);
    toast.success("Klien dihapus");
    router.refresh();
  }

  const itemCls =
    "flex w-full items-center gap-2.5 rounded-btn px-2.5 py-2 text-left text-sm text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  const newBtn = (
    <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>
      Klien baru
    </Button>
  );

  return (
    <div className="space-y-4">
      {clients.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Belum ada klien"
            description="Tambah klien agar bisa dipakai ulang saat membuat invoice."
            action={newBtn}
          />
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input placeholder="Cari nama / email / telp…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
            {newBtn}
          </div>

          <Card className="overflow-hidden">
            <Table>
              <THead>
                <tr>
                  <TH>Nama</TH>
                  <TH>Email</TH>
                  <TH>Telepon</TH>
                  <TH className="text-right">Aksi</TH>
                </tr>
              </THead>
              <TBody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted">Tidak ada klien yang cocok.</td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <TR key={c.id} className="cursor-pointer" onClick={() => router.push(`/clients/${c.id}`)}>
                      <TD className="font-medium">{c.name}</TD>
                      <TD className="text-muted">{c.email || "—"}</TD>
                      <TD className="text-muted">{c.phone || "—"}</TD>
                      <TD className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Dropdown
                          portal
                          align="right"
                          trigger={({ toggle }) => (
                            <IconButton aria-label={`Aksi ${c.name}`} size="sm" onClick={toggle}>
                              <MoreHorizontal className="h-4 w-4" />
                            </IconButton>
                          )}
                        >
                          {(close) => (
                            <>
                              <button type="button" onClick={() => { close(); openEdit(c); }} className={itemCls}>
                                <Pencil className="h-4 w-4" /> Edit
                              </button>
                              <button type="button" onClick={() => { close(); setDeleteTarget(c); }} className={cn(itemCls, "text-danger hover:bg-danger-soft")}>
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
          </Card>
        </>
      )}

      <ClientDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initial={editTarget}
        onSaved={() => router.refresh()}
      />

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        size="sm"
        title="Hapus klien?"
        description={`Klien ${deleteTarget?.name ?? ""} akan dihapus. Invoice lama tetap menyimpan nama klien.`}
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
