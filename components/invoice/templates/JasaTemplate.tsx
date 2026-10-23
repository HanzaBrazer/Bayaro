import { InvoiceDocBase } from "./InvoiceDocBase";
import type { TemplateProps } from "./types";

export function JasaTemplate(props: TemplateProps) {
  return <InvoiceDocBase {...props} variant="jasa" />;
}
