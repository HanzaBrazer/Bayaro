import type { Layout } from "./schema";

export const LETTERHEAD_BUCKET = "letterheads";
export const MAX_LETTERHEAD_BYTES = 5 * 1024 * 1024;

/** Hanya terima URL publik dari bucket kop surat milik proyek ini. */
export function isLetterheadUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !url) return false;
  return url.startsWith(`${base.replace(/\/$/, "")}/storage/v1/object/public/${LETTERHEAD_BUCKET}/`);
}

export interface CustomTemplateSummary {
  id: string;
  name: string;
  updatedAt: string;
  hasLetterhead: boolean;
}

export interface CustomTemplateRecord {
  id: string;
  name: string;
  layout: Layout;
  letterheadUrl: string | null;
  /** Jarak atas area aman (px, dalam satuan lebar A4 794px). */
  letterheadTop: number;
  /** Jarak bawah area aman (px). */
  letterheadBottom: number;
  updatedAt: string;
}

/** Kop surat yang diteruskan ke renderer. */
export interface Letterhead {
  url: string;
  top: number;
  bottom: number;
}
