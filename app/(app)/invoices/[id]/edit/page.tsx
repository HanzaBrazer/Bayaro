import { notFound } from "next/navigation";
import { getInvoiceForEdit } from "@/lib/invoice/actions";
import { getClients } from "@/lib/client/actions";
import { InvoiceEditor } from "@/components/invoice/InvoiceEditor";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getInvoiceForEdit(id);
  if (!data) notFound();
  const clients = await getClients();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-ink">Edit invoice</h2>
      <InvoiceEditor workspace={data.workspace} initialValues={data.values} mode="edit" invoiceId={data.id} publicToken={data.publicToken} clients={clients} />
    </div>
  );
}
