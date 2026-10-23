import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanFor } from "@/lib/plan/quota";
import { getTemplate } from "@/components/invoice/templates/registry";
import { PublicInvoiceActions } from "@/components/invoice/PublicInvoiceActions";
import type { InvoiceFormValues, WorkspaceInfo, ItemCategory } from "@/lib/invoice/types";
import type { InvoiceTotals } from "@/lib/invoice/calc";

export const dynamic = "force-dynamic";

export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { token } = await params;
  const { print } = await searchParams;
  const isPrint = print === "1";

  const admin = createAdminClient();
  const { data: inv } = await admin.from("invoices").select("*").eq("public_token", token).maybeSingle();
  if (!inv) notFound();

  const { data: items } = await admin
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", inv.id)
    .order("position", { ascending: true });
  const { data: ws } = await admin.from("workspaces").select("*").eq("id", inv.workspace_id).maybeSingle();

  const afterDiscount = Number(inv.subtotal) - Number(inv.discount);
  const values: InvoiceFormValues = {
    clientId: inv.client_id ?? null,
    clientName: inv.client_name ?? "",
    clientAddress: inv.client_address ?? "",
    number: inv.number ?? "",
    issueDate: inv.issue_date ?? "",
    dueDate: inv.due_date ?? null,
    items: (items ?? []).map((it: Record<string, unknown>, idx: number) => ({
      key: `i${idx}`,
      description: (it.description as string) ?? "",
      quantity: Number(it.quantity) || 0,
      unit_price: Number(it.unit_price) || 0,
      category: ((it.category as ItemCategory) ?? "lainnya"),
    })),
    taxPercent: afterDiscount > 0 ? Math.round((Number(inv.tax) / afterDiscount) * 100) : 0,
    discount: Number(inv.discount) || 0,
    notes: inv.notes ?? "",
    templateId: inv.template_id ?? "jasa",
  };
  const totals: InvoiceTotals = {
    subtotal: Number(inv.subtotal) || 0,
    discount: Number(inv.discount) || 0,
    tax: Number(inv.tax) || 0,
    total: Number(inv.total) || 0,
  };
  const workspace = (ws ?? {}) as WorkspaceInfo;

  // Watermark hanya untuk pemilik invoice ber-plan Free; Pro tanpa watermark.
  const ownerPlan = await getPlanFor(admin, inv.user_id as string);
  const watermark = ownerPlan === "free";
  const Template = getTemplate(values.templateId).component;

  if (isPrint) {
    return (
      <div className="bg-white">
        <Template workspace={workspace} values={values} totals={totals} watermark={watermark} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-canvas py-8">
      <div className="mx-auto max-w-[840px] px-4">
        <PublicInvoiceActions token={token} number={values.number} />
        <div className="mt-4 overflow-hidden rounded-card border border-line shadow-card">
          <Template workspace={workspace} values={values} totals={totals} watermark={watermark} />
        </div>
        <p className="mt-6 text-center text-xs text-muted">Dibuat dengan Bayaro</p>
      </div>
    </main>
  );
}
