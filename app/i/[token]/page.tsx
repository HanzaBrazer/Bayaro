import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { BayaroMark } from "@/components/brand/Logo";
import { Link2Off } from "lucide-react";
import { listInvites } from "@/lib/share/actions";
import { getPlanFor } from "@/lib/plan/quota";
import { InvoiceDocument, toCustomMap } from "@/components/invoice/templates/InvoiceDocument";
import { isCustomTemplateId, CUSTOM_PREFIX, safeLayout } from "@/lib/custom-template/schema";
import type { CustomTemplateRecord } from "@/lib/custom-template/types";
import { PublicInvoiceActions } from "@/components/invoice/PublicInvoiceActions";
import { getPublicClaimStatus, getPendingProofFor } from "@/lib/payment/actions";
import { isEmailConfigured } from "@/lib/email/send";
import type { InvoiceFormValues, WorkspaceInfo, ItemCategory } from "@/lib/invoice/types";
import type { InvoiceTotals } from "@/lib/invoice/calc";

export const dynamic = "force-dynamic";

/** Template kustom milik pemilik invoice; dibaca lewat service role agar bisa dilihat publik. */
async function loadCustomTemplate(templateId: string): Promise<CustomTemplateRecord[]> {
  if (!isCustomTemplateId(templateId)) return [];
  const { data } = await createAdminClient()
    .from("custom_templates")
    .select("id,name,layout,letterhead_url,letterhead_top,letterhead_bottom,updated_at")
    .eq("id", templateId.slice(CUSTOM_PREFIX.length))
    .maybeSingle();
  if (!data) return [];
  return [
    {
      id: data.id as string,
      name: data.name as string,
      layout: safeLayout(data.layout),
      letterheadUrl: (data.letterhead_url as string) ?? null,
      letterheadTop: Number(data.letterhead_top) || 0,
      letterheadBottom: Number(data.letterhead_bottom) || 0,
      updatedAt: data.updated_at as string,
    },
  ];
}

export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ print?: string; dl?: string }>;
}) {
  const { token } = await params;
  const { print, dl } = await searchParams;
  const isPrint = print === "1";
  const autoDownload = dl === "pdf" || dl === "png" ? dl : null;

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
    projectName: inv.project_name ?? "",
    clientName: inv.client_name ?? "",
    clientAddress: inv.client_address ?? "",
    clientEmail: inv.client_email ?? "",
    clientPhone: inv.client_phone ?? "",
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
    terms: inv.terms ?? "",
    templateId: inv.template_id ?? "jasa",
  };
  const totals: InvoiceTotals = {
    subtotal: Number(inv.subtotal) || 0,
    discount: Number(inv.discount) || 0,
    tax: Number(inv.tax) || 0,
    total: Number(inv.total) || 0,
  };
  const workspace = (ws ?? {}) as WorkspaceInfo;

  // Kontak untuk tombol "Bagikan": pakai snapshot di invoice; bila kosong,
  // ambil kontak terkini dari klien tertaut (invoice lama belum punya snapshot).
  let shareEmail = values.clientEmail;
  let sharePhone = values.clientPhone;
  if ((!shareEmail || !sharePhone) && inv.client_id) {
    const { data: linked } = await admin
      .from("clients")
      .select("email,phone")
      .eq("id", inv.client_id)
      .maybeSingle();
    shareEmail = shareEmail || ((linked?.email as string) ?? "");
    sharePhone = sharePhone || ((linked?.phone as string) ?? "");
  }

  // Apakah yang membuka halaman ini pemilik invoice? (sesi login, bila ada)
  const sessionClient = await createServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  const isOwner = !!user && (ws as { owner_user_id?: string } | null)?.owner_user_id === user.id;

  // Tautan dinonaktifkan: benar-benar tidak bisa dibuka siapa pun kecuali
  // pemiliknya (agar ia masih bisa mengaktifkannya kembali).
  const linkActive = (inv as { link_active?: boolean }).link_active !== false;
  if (!linkActive && !isOwner) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="max-w-md rounded-card border border-line bg-surface p-8 text-center shadow-card">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-muted">
            <Link2Off className="h-5 w-5" />
          </span>
          <h1 className="text-lg font-semibold text-ink">Tautan tidak aktif</h1>
          <p className="mt-1.5 text-sm text-muted">
            Penerbit invoice menonaktifkan tautan ini. Hubungi pengirim untuk meminta
            tautan baru.
          </p>
        </div>
      </main>
    );
  }

  const pendingProof = isOwner ? await getPendingProofFor(inv.id as string) : null;
  const invites = isOwner ? await listInvites(inv.id as string) : [];

  // Watermark hanya untuk pemilik invoice ber-plan Free; Pro tanpa watermark.
  const claimStatus = await getPublicClaimStatus(token);
  const ownerPlan = await getPlanFor(admin, inv.user_id as string);
  const watermark = ownerPlan === "free";
  // Pengunjung bukan pemilik, jadi template kustomnya dibaca lewat service role.
  const customs = toCustomMap(await loadCustomTemplate(values.templateId));
  const doc = (
    <InvoiceDocument
      templateId={values.templateId}
      customs={customs}
      workspace={workspace}
      values={values}
      totals={totals}
      watermark={watermark}
    />
  );

  if (isPrint) return <div className="bg-white">{doc}</div>;

  return (
    <main className="min-h-screen bg-canvas py-8">
      <div className="mx-auto max-w-[1120px] px-4">
        {/* Kop halaman */}
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-card bg-ink text-bone">
            <BayaroMark className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-muted">Invoice</p>
            <p className="font-mono text-base font-semibold text-ink">{values.number}</p>
          </div>
        </div>

        {/* Dokumen (kiri) + panel aksi (kanan). Di mobile panel naik ke atas. */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          {/* Panel aksi didahulukan di DOM agar urutan fokus = urutan tampil di mobile;
              di desktop digeser ke kolom kanan lewat `order`. */}
          <div className="lg:order-2 lg:sticky lg:top-6">
            <PublicInvoiceActions
              token={token}
              number={values.number}
              invoiceId={inv.id as string}
              total={totals.total}
              dueDate={values.dueDate}
              isPaid={inv.status === "lunas"}
              claimStatus={claimStatus}
              isOwner={isOwner}
              pendingProof={pendingProof}
              businessName={workspace.name || "Usaha Saya"}
              clientName={values.clientName}
              clientEmail={shareEmail}
              clientPhone={sharePhone}
              emailEnabled={isEmailConfigured()}
              linkActive={linkActive}
              invites={invites}
              autoDownload={autoDownload}
            />
          </div>
          {/* Dokumen berukuran tetap A4 (794px). Di layar sempit digeser
              horizontal, bukan dipaksa menyusut — tata letak absolutnya akan
              saling tumpuk kalau kontainernya mengecil. */}
          <div className="overflow-x-auto rounded-card border border-line shadow-card lg:order-1">
            <div className="w-[794px]">
              {doc}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">Dibuat dengan Bayaro</p>
      </div>
    </main>
  );
}
