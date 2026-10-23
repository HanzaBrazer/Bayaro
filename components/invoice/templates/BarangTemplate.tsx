import { InvoiceDocBase } from "./InvoiceDocBase";
import type { TemplateProps } from "./types";

export function BarangTemplate(props: TemplateProps) {
  return <InvoiceDocBase {...props} variant="barang" />;
}
