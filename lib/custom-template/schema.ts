import { z } from "zod";

/**
 * Skema template kustom (builder blok).
 * Layout = pengaturan global + baris berisi 1–3 kolom, tiap kolom berisi blok.
 * Semua nilai bertipe & terbatas: tidak ada HTML/CSS dari pengguna. Field yang
 * tidak dikenal dibuang oleh zod (default `.strip()`), bukan disimpan.
 */

export const BLOCK_TYPES = [
  "logo",
  "info_usaha",
  "info_klien",
  "detail_invoice",
  "nama_proyek",
  "tabel_item",
  "ringkasan_total",
  "info_pembayaran",
  "catatan",
  "syarat_ketentuan",
  "tanda_tangan",
  "footer",
  "teks_bebas",
  "pemisah",
  "spasi",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

/** Blok yang wajib ada — invoice tanpa ini tidak masuk akal. */
export const REQUIRED_BLOCKS: BlockType[] = ["tabel_item", "ringkasan_total"];

export const MAX_BLOCKS = 60;
export const MAX_TEXT = 500;

export const BLOCK_LABEL: Record<BlockType, string> = {
  logo: "Logo",
  info_usaha: "Info usaha",
  info_klien: "Info klien",
  detail_invoice: "Detail invoice",
  nama_proyek: "Nama proyek",
  tabel_item: "Tabel item",
  ringkasan_total: "Ringkasan total",
  info_pembayaran: "Info pembayaran",
  catatan: "Catatan",
  syarat_ketentuan: "Syarat & ketentuan",
  tanda_tangan: "Tanda tangan",
  footer: "Footer",
  teks_bebas: "Teks bebas",
  pemisah: "Pemisah",
  spasi: "Spasi",
};

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format #RRGGBB.");

const settingsSchema = z.object({
  accentColor: hex.default("#2E7D5B"),
  baseFontSize: z.union([z.literal(12), z.literal(13), z.literal(14)]).default(13),
  pageMargin: z.enum(["S", "M", "L"]).default("M"),
  numberStyle: z.enum(["biasa", "mono"]).default("mono"),
  titleLabel: z.enum(["INVOICE", "FAKTUR", "TAGIHAN"]).default("INVOICE"),
});

/** Field yang bisa disembunyikan per blok (semua opsional, default tampil). */
const fieldsSchema = z
  .object({
    address: z.boolean(),
    phone: z.boolean(),
    email: z.boolean(),
    website: z.boolean(),
    number: z.boolean(),
    issueDate: z.boolean(),
    dueDate: z.boolean(),
    bank: z.boolean(),
    accountNumber: z.boolean(),
    accountHolder: z.boolean(),
    subtotal: z.boolean(),
    discount: z.boolean(),
    tax: z.boolean(),
  })
  .partial();

const columnsSchema = z
  .object({
    no: z.boolean(),
    category: z.boolean(),
    qty: z.boolean(),
    price: z.boolean(),
    amount: z.boolean(),
  })
  .partial();

const propsSchema = z
  .object({
    align: z.enum(["left", "center", "right"]),
    showTitle: z.boolean(),
    background: z.enum(["none", "accent", "muted"]),
    size: z.enum(["S", "M", "L"]),
    fields: fieldsSchema,
    columns: columnsSchema,
    text: z.string().max(MAX_TEXT, `Teks maksimal ${MAX_TEXT} karakter.`),
  })
  .partial();

export const blockSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(BLOCK_TYPES),
  props: propsSchema.default({}),
});

const rowSchema = z
  .object({
    id: z.string().min(1).max(64),
    columns: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    /** Latar selebar halaman (pita), mis. header gelap atau footer abu. */
    background: z.enum(["none", "accent", "muted"]).default("none"),
    cells: z.array(z.array(blockSchema)),
  })
  .refine((r) => r.cells.length === r.columns, {
    message: "Jumlah kolom tidak cocok dengan isi baris.",
  });

export const layoutSchema = z
  .object({
    settings: settingsSchema.default({}),
    rows: z.array(rowSchema),
  })
  .superRefine((layout, ctx) => {
    const blocks = layout.rows.flatMap((r) => r.cells.flat());
    if (blocks.length > MAX_BLOCKS) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Maksimal ${MAX_BLOCKS} blok per template.` });
    }
    for (const req of REQUIRED_BLOCKS) {
      if (!blocks.some((b) => b.type === req)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Template wajib memuat blok "${BLOCK_LABEL[req]}".`,
        });
      }
    }
  });

export type Layout = z.infer<typeof layoutSchema>;
export type LayoutRow = Layout["rows"][number];
export type Block = z.infer<typeof blockSchema>;
export type BlockProps = Block["props"];
export type LayoutSettings = Layout["settings"];

/** Validasi ketat — dipakai saat MENYIMPAN. Pesan error pertama dikembalikan. */
export function parseLayout(input: unknown): { ok: true; layout: Layout } | { ok: false; error: string } {
  const res = layoutSchema.safeParse(input);
  if (res.success) return { ok: true, layout: res.data };
  return { ok: false, error: res.error.issues[0]?.message ?? "Layout tidak valid." };
}

/** Validasi longgar — dipakai saat MERENDER: data rusak tidak boleh menjatuhkan halaman. */
export function safeLayout(input: unknown): Layout {
  const res = layoutSchema.safeParse(input);
  return res.success ? res.data : STARTERS.klasik.layout;
}

/* ============================ Titik awal ============================ */

let seq = 0;
const id = (p: string) => `${p}${++seq}`;
const b = (type: BlockType, props: BlockProps = {}): Block => ({ id: id("b"), type, props });
const row = (cells: Block[][], background: "none" | "accent" | "muted" = "none"): LayoutRow => ({
  id: id("r"),
  columns: cells.length as 1 | 2 | 3,
  background,
  cells,
});

export type StarterKey = "klasik" | "header_gelap" | "aksen_emas" | "minimal" | "kosong";

export const STARTERS: Record<StarterKey, { name: string; description: string; layout: Layout }> = {
  klasik: {
    name: "Klasik",
    description: "Logo & identitas di atas, tabel bersih, total di kanan.",
    layout: {
      settings: { accentColor: "#2E7D5B", baseFontSize: 13, pageMargin: "M", numberStyle: "mono", titleLabel: "INVOICE" },
      rows: [
        row([[b("logo", { size: "M" }), b("info_usaha", { showTitle: false })], [b("detail_invoice", { align: "right" })]]),
        row([[b("info_klien")], [b("nama_proyek", { align: "right" })]]),
        row([[b("tabel_item")]]),
        row([[b("info_pembayaran")], [b("ringkasan_total")]]),
        row([[b("catatan")], [b("tanda_tangan", { align: "right" })]]),
        row([[b("syarat_ketentuan")]]),
        row([[b("footer", { align: "center" })]]),
      ],
    },
  },
  header_gelap: {
    name: "Header gelap",
    description: "Pita gelap di atas, kesan tegas untuk penjualan barang.",
    layout: {
      settings: { accentColor: "#1C1A17", baseFontSize: 13, pageMargin: "M", numberStyle: "mono", titleLabel: "INVOICE" },
      rows: [
        row([[b("logo", { size: "M" }), b("info_usaha", { showTitle: false })], [b("detail_invoice", { align: "right" })]], "accent"),
        row([[b("info_klien")], [b("nama_proyek", { align: "right" })]]),
        row([[b("tabel_item")]]),
        row([[b("catatan")], [b("ringkasan_total")]]),
        row([[b("info_pembayaran")], [b("tanda_tangan", { align: "right" })]]),
        row([[b("footer", { align: "center" })]], "muted"),
      ],
    },
  },
  aksen_emas: {
    name: "Aksen emas",
    description: "Sentuhan emas, cocok untuk sewa & jasa premium.",
    layout: {
      settings: { accentColor: "#C9A227", baseFontSize: 13, pageMargin: "L", numberStyle: "biasa", titleLabel: "TAGIHAN" },
      rows: [
        row([[b("detail_invoice")], [b("logo", { size: "L", align: "right" })]]),
        row([[b("pemisah")]]),
        row([[b("info_usaha")], [b("info_klien", { align: "right" })]]),
        row([[b("tabel_item")]]),
        row([[b("syarat_ketentuan")], [b("ringkasan_total")]]),
        row([[b("info_pembayaran")], [b("tanda_tangan", { align: "right" })]]),
      ],
    },
  },
  minimal: {
    name: "Minimal",
    description: "Ringkas tanpa hiasan — hanya yang penting.",
    layout: {
      settings: { accentColor: "#1C1A17", baseFontSize: 12, pageMargin: "S", numberStyle: "biasa", titleLabel: "INVOICE" },
      rows: [
        row([[b("detail_invoice", { fields: { dueDate: true } })], [b("info_klien", { align: "right", fields: { phone: false, email: false } })]]),
        row([[b("tabel_item", { columns: { no: false, category: false } })]]),
        row([[b("ringkasan_total", { fields: { discount: false } })]]),
        row([[b("info_pembayaran")]]),
      ],
    },
  },
  kosong: {
    name: "Kosong",
    description: "Mulai dari tabel item & total saja, susun sisanya sendiri.",
    layout: {
      settings: { accentColor: "#2E7D5B", baseFontSize: 13, pageMargin: "M", numberStyle: "mono", titleLabel: "INVOICE" },
      rows: [row([[b("tabel_item")]]), row([[b("ringkasan_total")]])],
    },
  },
};

export const STARTER_KEYS = Object.keys(STARTERS) as StarterKey[];

/** Prefix template_id invoice yang memakai template kustom. */
export const CUSTOM_PREFIX = "custom:";
export const isCustomTemplateId = (v: string | null | undefined) => !!v && v.startsWith(CUSTOM_PREFIX);
export const customTemplateId = (uuid: string) => `${CUSTOM_PREFIX}${uuid}`;
