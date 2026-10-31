import { z } from "zod";

/**
 * Jenis usaha di wizard "Buat workspace". Hanya dipakai untuk memilih template
 * default yang paling cocok — tidak disimpan sebagai kolom tersendiri.
 */
export const BUSINESS_TYPES = [
  { key: "jasa", label: "Jasa & Freelance", template: "jasa" },
  { key: "agensi", label: "Agensi & Studio Kreatif", template: "jasa" },
  { key: "toko", label: "Toko & Penjualan Barang", template: "barang" },
  { key: "sewa", label: "Sewa & Rental", template: "sewa" },
  { key: "kuliner", label: "Kuliner & F&B", template: "barang" },
  { key: "lainnya", label: "Lainnya", template: "jasa" },
] as const;

export type BusinessTypeKey = (typeof BUSINESS_TYPES)[number]["key"];

const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter.`)
    .optional()
    .transform((v) => (v ? v : null));

export const newWorkspaceSchema = z.object({
  businessType: z.enum(BUSINESS_TYPES.map((b) => b.key) as [BusinessTypeKey, ...BusinessTypeKey[]], {
    errorMap: () => ({ message: "Pilih jenis usaha." }),
  }),
  name: z.string().trim().min(1, "Nama usaha wajib diisi.").max(80, "Nama usaha maksimal 80 karakter."),
  address: opt(300),
  phone: opt(30),
  email: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Format email tidak valid."),
  website: opt(120),
  bankName: opt(60),
  accountNumber: opt(40),
  accountHolder: opt(80),
  signatory: opt(80),
  prefix: z
    .string()
    .trim()
    .max(12, "Prefix maksimal 12 karakter.")
    .optional()
    .transform((v) => v || "INV-"),
  startNumber: z.coerce
    .number({ invalid_type_error: "Nomor mulai harus angka." })
    .int("Nomor mulai harus bilangan bulat.")
    .min(1, "Nomor mulai minimal 1.")
    .max(999999, "Nomor mulai terlalu besar."),
});

export type NewWorkspaceInput = z.input<typeof newWorkspaceSchema>;

export const templateForBusiness = (key: BusinessTypeKey) =>
  BUSINESS_TYPES.find((b) => b.key === key)?.template ?? "jasa";

/** Pratinjau nomor invoice pertama, mis. "INV-0001". */
export const previewNumber = (prefix: string, start: number) =>
  `${prefix || "INV-"}${String(Math.max(1, Math.floor(start) || 1)).padStart(4, "0")}`;
