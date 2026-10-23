import { InvoiceDocBase } from "./InvoiceDocBase";
import type { TemplateProps } from "./types";

export function SewaTemplate(props: TemplateProps) {
  return <InvoiceDocBase {...props} variant="sewa" />;
}
