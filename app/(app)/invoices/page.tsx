import { getInvoices } from "@/lib/invoice/actions";
import { InvoiceList } from "@/components/invoice/InvoiceList";

export const dynamic = "force-dynamic";

const VALID = ["draft", "terkirim", "lunas", "jatuh_tempo"];

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [{ status }, invoices] = await Promise.all([searchParams, getInvoices()]);
  const initialStatus = status && VALID.includes(status) ? status : "all";
  return <InvoiceList invoices={invoices} initialStatus={initialStatus} />;
}
