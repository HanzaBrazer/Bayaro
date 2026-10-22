"use client";

import * as React from "react";
import {
  FileText,
  Users,
  CheckCircle2,
  Wallet,
  Plus,
  Trash2,
  Download,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import {
  Button,
  IconButton,
  Input,
  CurrencyInput,
  Textarea,
  Select,
  DatePicker,
  Toggle,
  FileUpload,
  Card,
  CardContent,
  StatCard,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  TDNumber,
  SortableTH,
  Pagination,
  Badge,
  StatusBadge,
  Modal,
  Drawer,
  PaywallModal,
  EmptyState,
  useToast,
  type InvoiceStatus,
} from "@/components/ui";
import { formatRupiah } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      <Card>
        <CardContent className="space-y-6">{children}</CardContent>
      </Card>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="w-full shrink-0 text-xs font-medium uppercase tracking-wide text-muted sm:w-32">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

const CATEGORY_OPTIONS = [
  { value: "barang", label: "Barang", colorDot: "#2E7D5B" },
  { value: "jasa", label: "Jasa", colorDot: "#1C1A17" },
  { value: "transportasi", label: "Transportasi", colorDot: "#C9A227" },
  { value: "lainnya", label: "Lainnya", colorDot: "#8B6FB0" },
];

type SampleInvoice = {
  no: string;
  klien: string;
  tanggal: string;
  dateValue: number;
  total: number;
  status: InvoiceStatus;
};

const SAMPLE: SampleInvoice[] = [
  { no: "INV-048", klien: "PT Maju Jaya", tanggal: "12 Okt 2026", dateValue: 20261012, total: 3000000, status: "lunas" },
  { no: "INV-047", klien: "Budi Santoso", tanggal: "10 Okt 2026", dateValue: 20261010, total: 1200000, status: "terkirim" },
  { no: "INV-046", klien: "CV Sinar Abadi", tanggal: "8 Okt 2026", dateValue: 20261008, total: 7500000, status: "lunas" },
  { no: "INV-045", klien: "Rina Wijaya", tanggal: "5 Okt 2026", dateValue: 20261005, total: 850000, status: "jatuh_tempo" },
  { no: "INV-044", klien: "Toko Berkah", tanggal: "2 Okt 2026", dateValue: 20261002, total: 2250000, status: "draft" },
  { no: "INV-043", klien: "PT Nusantara", tanggal: "28 Sep 2026", dateValue: 20260928, total: 5400000, status: "lunas" },
];

export default function ComponentsShowcasePage() {
  const toast = useToast();

  // form demo states
  const [currency, setCurrency] = React.useState<number | null>(1500000);
  const [category, setCategory] = React.useState<string | null>("jasa");
  const [date, setDate] = React.useState<Date | null>(new Date());
  const [toggleA, setToggleA] = React.useState(true);
  const [toggleB, setToggleB] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // overlay states
  const [modalOpen, setModalOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [paywallOpen, setPaywallOpen] = React.useState(false);

  // table states
  const [sort, setSort] = React.useState<{ key: "total" | "dateValue" | "no"; dir: "asc" | "desc" }>({
    key: "dateValue",
    dir: "desc",
  });
  const [page, setPage] = React.useState(1);
  const pageSize = 4;

  const sorted = React.useMemo(() => {
    const copy = [...SAMPLE];
    copy.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [sort]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: "total" | "dateValue" | "no") => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
    setPage(1);
  };
  const sortDir = (key: string) => (sort.key === key ? sort.dir : false);

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Invoice tersimpan", "Data berhasil disimpan ke daftar.");
    }, 1400);
  };

  return (
    <main className="mx-auto max-w-5xl space-y-10 p-6 md:p-10">
      <header className="flex flex-col gap-3 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Logo showWordmark={false} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Component Library</h1>
            <p className="text-sm text-muted">Showcase komponen dasar &amp; semua state — design.md §3</p>
          </div>
        </div>
        <Badge tone="green">/dev/components</Badge>
      </header>

      {/* BUTTONS */}
      <Section title="Button" description="Varian, ukuran, dan state (hover, focus, disabled, loading).">
        <Row label="Varian">
          <Button variant="primary">Simpan invoice</Button>
          <Button variant="secondary">Preview</Button>
          <Button variant="ghost">Batal</Button>
          <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />}>
            Hapus
          </Button>
        </Row>
        <Row label="Dengan ikon">
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            Invoice Baru
          </Button>
          <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </Row>
        <Row label="Ukuran">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
        </Row>
        <Row label="State">
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Button onClick={simulateLoading} loading={loading}>
            Klik untuk loading
          </Button>
        </Row>
        <Row label="Icon-only">
          <IconButton aria-label="Edit" variant="secondary">
            <Pencil className="h-4 w-4" />
          </IconButton>
          <IconButton aria-label="Hapus" variant="danger">
            <Trash2 className="h-4 w-4" />
          </IconButton>
          <IconButton aria-label="Menu baris">
            <MoreHorizontal className="h-4 w-4" />
          </IconButton>
        </Row>
      </Section>

      {/* BADGES */}
      <Section title="Badge & Status" description="Pill status invoice dan badge umum.">
        <Row label="Status">
          <StatusBadge status="draft" />
          <StatusBadge status="terkirim" />
          <StatusBadge status="lunas" />
          <StatusBadge status="jatuh_tempo" />
        </Row>
        <Row label="Tone">
          <Badge tone="neutral">Netral</Badge>
          <Badge tone="green">Hijau</Badge>
          <Badge tone="amber">Amber</Badge>
          <Badge tone="red">Merah</Badge>
          <Badge tone="blue">Info</Badge>
        </Row>
      </Section>

      {/* INPUTS */}
      <Section title="Input & Form" description="Label, helper, error inline, nominal, dan textarea.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Nama klien" placeholder="mis. PT Maju Jaya" helper="Nama penerima invoice." />
          <Input label="Email" placeholder="nama@email.com" type="email" />
          <Input label="Email (error)" defaultValue="salah-email" error="Format email tidak valid." />
          <Input label="Terkunci" defaultValue="Tidak bisa diubah" disabled />
          <CurrencyInput label="Nominal" value={currency} onValueChange={setCurrency} helper="Format ribuan otomatis." />
          <Textarea label="Catatan" placeholder="Termin pembayaran, ucapan terima kasih…" />
        </div>
      </Section>

      {/* SELECT & DATE */}
      <Section title="Select & DatePicker" description="Dropdown custom (ikon/warna kategori) & kalender dengan tombol cepat.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="Kategori item"
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={setCategory}
            helper="Mengisi data donut chart (fase lanjut)."
          />
          <Select
            label="Select (error)"
            options={CATEGORY_OPTIONS}
            value={null}
            onChange={() => {}}
            error="Wajib dipilih."
          />
          <DatePicker
            label="Jatuh tempo"
            value={date}
            onChange={setDate}
            quickButtons={[
              { label: "+14 hari", days: 14 },
              { label: "+30 hari", days: 30 },
            ]}
            helper="Desktop: kalender. Mobile: picker OS."
          />
          <Select label="Select (disabled)" options={CATEGORY_OPTIONS} value="barang" onChange={() => {}} disabled />
        </div>
      </Section>

      {/* TOGGLE & UPLOAD */}
      <Section title="Toggle & File Upload" description="Switch dan unggah logo dengan pratinjau.">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <Toggle checked={toggleA} onChange={setToggleA} label="Ingat saya" description="Pertahankan sesi login." />
            <Toggle checked={toggleB} onChange={setToggleB} label="Watermark Free" description="Tampilkan watermark halus." />
            <Toggle checked={false} onChange={() => {}} label="Nonaktif" disabled />
          </div>
          <FileUpload label="Logo usaha" helper="Tampil di pojok invoice." maxSizeMB={2} />
        </div>
      </Section>

      {/* STAT CARDS */}
      <Section title="Stat Card" description="Kartu statistik gaya dashboard.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<FileText className="h-4 w-4" />} label="Total Invoice" value="128" trend={{ value: "12%", direction: "up" }} />
          <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Lunas" value="73" trend={{ value: "4%", direction: "up" }} />
          <StatCard icon={<Users className="h-4 w-4" />} label="Klien" value="24" />
          <StatCard icon={<Wallet className="h-4 w-4" />} label="Nilai bulan ini" value="Rp 54,1Jt" trend={{ value: "3%", direction: "down" }} />
        </div>
      </Section>

      {/* TABLE */}
      <Section title="Table" description="Header sortable, nominal rata kanan (mono), aksi baris, paginasi.">
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <SortableTH sorted={sortDir("no")} onSort={() => toggleSort("no")}>
                  No.
                </SortableTH>
                <TH>Klien</TH>
                <SortableTH sorted={sortDir("dateValue")} onSort={() => toggleSort("dateValue")}>
                  Tanggal
                </SortableTH>
                <SortableTH align="right" sorted={sortDir("total")} onSort={() => toggleSort("total")}>
                  Total
                </SortableTH>
                <TH>Status</TH>
                <TH className="text-right">Aksi</TH>
              </tr>
            </THead>
            <TBody>
              {pageRows.map((r) => (
                <TR key={r.no}>
                  <TD className="font-mono text-ink-soft">{r.no}</TD>
                  <TD className="font-medium">{r.klien}</TD>
                  <TD className="text-muted">{r.tanggal}</TD>
                  <TDNumber>Rp {formatRupiah(r.total)}</TDNumber>
                  <TD>
                    <StatusBadge status={r.status} />
                  </TD>
                  <TD className="text-right">
                    <IconButton aria-label={`Aksi ${r.no}`} size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </IconButton>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </Card>
      </Section>

      {/* OVERLAYS */}
      <Section title="Modal, Drawer, Toast & Paywall" description="Overlay dengan Esc / klik luar untuk menutup.">
        <Row label="Buka">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Modal
          </Button>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
            Drawer
          </Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)} leftIcon={<Trash2 className="h-4 w-4" />}>
            Konfirmasi hapus
          </Button>
          <Button variant="secondary" onClick={() => setPaywallOpen(true)}>
            Paywall
          </Button>
        </Row>
        <Row label="Toast">
          <Button variant="secondary" onClick={() => toast.success("Invoice tersimpan", "Draft berhasil disimpan.")}>
            Sukses
          </Button>
          <Button variant="secondary" onClick={() => toast.error("Gagal membuat PDF", "Coba lagi sebentar.")}>
            Error
          </Button>
          <Button variant="secondary" onClick={() => toast.info("Kuota tersisa 3/10", "Reset tengah malam WIB.")}>
            Info
          </Button>
        </Row>
      </Section>

      {/* EMPTY STATE */}
      <Section title="Empty State">
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="Belum ada invoice"
          description="Buat invoice pertamamu untuk mulai menagih klien."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => toast.info("Demo", "Tombol empty state.")}>
              Invoice Baru
            </Button>
          }
        />
      </Section>

      <footer className="border-t border-line pt-6 text-center text-xs text-muted">
        Bayaro Component Library — semua tombol punya aksi, state &amp; umpan balik.
      </footer>

      {/* ---- Overlay instances ---- */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Contoh modal"
        description="Modal tengah untuk konfirmasi atau form singkat."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                setModalOpen(false);
                toast.success("Tersimpan");
              }}
            >
              Simpan
            </Button>
          </>
        }
      >
        <p>Tekan <kbd className="rounded border border-line bg-canvas px-1 text-xs">Esc</kbd>, klik overlay, atau tombol × untuk menutup.</p>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        size="sm"
        title="Hapus invoice?"
        description="Tindakan ini tidak bisa dibatalkan."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              className="bg-danger hover:bg-danger/90"
              onClick={() => {
                setConfirmOpen(false);
                toast.success("Invoice dihapus");
              }}
            >
              Ya, hapus
            </Button>
          </>
        }
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Klien baru"
        description="Tambah klien tanpa keluar halaman."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                setDrawerOpen(false);
                toast.success("Klien tersimpan");
              }}
            >
              Simpan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nama" placeholder="Nama klien" />
          <Input label="Email" placeholder="email@contoh.com" type="email" />
          <Textarea label="Alamat" placeholder="Alamat penagihan" />
        </div>
      </Drawer>

      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onUpgrade={() => {
          setPaywallOpen(false);
          toast.info("Menuju Billing", "Alur Midtrans menyusul di Langkah 10.");
        }}
      />
    </main>
  );
}
