import type { Layout } from "./schema";

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
