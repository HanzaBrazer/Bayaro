import { getInvoices } from "@/lib/invoice/actions";
import { InvoiceList } from "@/components/invoice/InvoiceList";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const invoices = await getInvoices();
  return <InvoiceList invoices={invoices} />;
}
