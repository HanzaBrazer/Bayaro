import { notFound, redirect } from "next/navigation";
import { followRecordWorkspace } from "@/lib/workspace/active";
import { getInvoiceForEdit } from "@/lib/invoice/actions";
import { getClients } from "@/lib/client/actions";
import { listCustomTemplateRecords } from "@/lib/custom-template/actions";
import { InvoiceEditor } from "@/components/invoice/InvoiceEditor";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Link dari workspace lain milik user → pindah dulu, lalu muat ulang.
  if (await followRecordWorkspace("invoices", id)) redirect(`/invoices/${id}/edit`);
  const data = await getInvoiceForEdit(id);
  if (!data) notFound();
  const [clients, customTemplates] = await Promise.all([getClients(), listCustomTemplateRecords()]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-ink">Edit invoice</h2>
      <InvoiceEditor workspace={data.workspace} initialValues={data.values} mode="edit" invoiceId={data.id} publicToken={data.publicToken} clients={clients} customTemplates={customTemplates} />
    </div>
  );
}
