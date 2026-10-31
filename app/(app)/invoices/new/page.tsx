import { redirect } from "next/navigation";
import { getMyWorkspace } from "@/lib/workspace/actions";
import { getClients } from "@/lib/client/actions";
import { listCustomTemplateRecords } from "@/lib/custom-template/actions";
import { InvoiceEditor } from "@/components/invoice/InvoiceEditor";
import type { InvoiceFormValues } from "@/lib/invoice/types";

export const dynamic = "force-dynamic";

function todayWIB(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function NewInvoicePage() {
  const ws = await getMyWorkspace();
  if (!ws) redirect("/onboarding");

  const [clients, customTemplates] = await Promise.all([getClients(), listCustomTemplateRecords()]);
  const suggestion = `${ws.invoice_prefix ?? "INV-"}${String(ws.next_invoice_number ?? 1).padStart(4, "0")}`;

  const initialValues: InvoiceFormValues = {
    clientId: null,
    projectName: "",
    clientName: "",
    clientAddress: "",
    clientEmail: "",
    clientPhone: "",
    number: suggestion,
    issueDate: todayWIB(),
    dueDate: null,
    items: [{ key: "item-1", description: "", quantity: 1, unit_price: 0, category: "jasa" }],
    taxPercent: 11,
    discount: 0,
    notes: "",
    terms: ws.terms ?? "",
    templateId: ws.default_template_id ?? "jasa",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-ink">Invoice baru</h2>
      <InvoiceEditor workspace={ws} initialValues={initialValues} mode="new" clients={clients} customTemplates={customTemplates} />
    </div>
  );
}
