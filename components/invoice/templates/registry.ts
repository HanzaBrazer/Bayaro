import type { TemplateProps } from "./types";
import { JasaTemplate } from "./JasaTemplate";
import { BarangTemplate } from "./BarangTemplate";
import { SewaTemplate } from "./SewaTemplate";
import { KwitansiTemplate } from "./KwitansiTemplate";

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  component: (props: TemplateProps) => React.JSX.Element;
}

export const TEMPLATES: TemplateMeta[] = [
  { id: "jasa", name: "Jasa", description: "Invoice bersih untuk jasa & proyek.", component: JasaTemplate },
  { id: "barang", name: "Barang", description: "Header gelap tegas untuk penjualan barang.", component: BarangTemplate },
  { id: "sewa", name: "Sewa", description: "Aksen emas, cocok untuk sewa/rental.", component: SewaTemplate },
  { id: "kwitansi", name: "Kwitansi", description: "Tanda terima pembayaran (receipt).", component: KwitansiTemplate },
];

export function getTemplate(id: string | null | undefined): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
