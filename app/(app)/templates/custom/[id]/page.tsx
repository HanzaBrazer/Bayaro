import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getMyWorkspace } from "@/lib/workspace/actions";
import { getCustomTemplate } from "@/lib/custom-template/actions";
import { CustomTemplate } from "@/components/invoice/templates/CustomTemplate";
import { SAMPLE_VALUES, SAMPLE_TOTALS } from "@/lib/custom-template/sample";

export const dynamic = "force-dynamic";

export default async function CustomTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ws = await getMyWorkspace();
  if (!ws) redirect("/onboarding");
  const tpl = await getCustomTemplate(id);
  if (!tpl) notFound();

  return (
    <div className="space-y-4">
      <Link href="/templates" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Template
      </Link>
      <h2 className="text-lg font-semibold text-ink">{tpl.name}</h2>
      <div className="overflow-x-auto rounded-card border border-line shadow-card">
        <div className="w-[794px]">
          <CustomTemplate
            layout={tpl.layout}
            letterhead={tpl.letterheadUrl ? { url: tpl.letterheadUrl, top: tpl.letterheadTop, bottom: tpl.letterheadBottom } : null}
            workspace={ws}
            values={SAMPLE_VALUES}
            totals={SAMPLE_TOTALS}
          />
        </div>
      </div>
    </div>
  );
}
