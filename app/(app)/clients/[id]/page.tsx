import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { followRecordWorkspace } from "@/lib/workspace/active";
import { ArrowLeft, Mail, Phone, MapPin, FileText } from "lucide-react";
import { getClientDetail } from "@/lib/client/actions";
import {
  Card,
  CardHeader,
  CardTitle,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  TDNumber,
  StatusBadge,
  EmptyState,
  type InvoiceStatus,
} from "@/components/ui";
import { formatRupiah, formatDateID } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Link dari workspace lain milik user → pindah dulu, lalu muat ulang.
  if (await followRecordWorkspace("clients", id)) redirect(`/clients/${id}`);
  const client = await getClientDetail(id);
  if (!client) notFound();

  return (
    <div className="space-y-4">
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Klien
      </Link>

      <Card className="p-5">
        <h2 className="text-xl font-bold tracking-tight text-ink">{client.name}</h2>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-muted">
          {client.email && (
            <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" /> {client.email}</span>
          )}
          {client.phone && (
            <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4" /> {client.phone}</span>
          )}
          {client.address && (
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {client.address}</span>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Invoice klien ini</CardTitle>
          <span className="text-sm text-muted">{client.invoices.length} invoice</span>
        </CardHeader>
        {client.invoices.length === 0 ? (
          <EmptyState icon={<FileText className="h-6 w-6" />} title="Belum ada invoice" description="Invoice untuk klien ini akan muncul di sini." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>No.</TH>
                <TH>Tanggal</TH>
                <TH className="text-right">Total</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {client.invoices.map((inv) => (
                <TR key={inv.id}>
                  <TD className="font-mono">
                    <Link href={`/invoices/${inv.id}/edit`} className="text-ink hover:text-primary hover:underline">
                      {inv.number}
                    </Link>
                  </TD>
                  <TD className="text-muted">{formatDateID(inv.issue_date)}</TD>
                  <TDNumber>Rp {formatRupiah(inv.total)}</TDNumber>
                  <TD>
                    <StatusBadge status={inv.status as InvoiceStatus} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
