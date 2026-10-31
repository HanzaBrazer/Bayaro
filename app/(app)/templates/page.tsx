import { redirect } from "next/navigation";
import { getMyWorkspace } from "@/lib/workspace/actions";
import { listCustomTemplates } from "@/lib/custom-template/actions";
import { TemplateGallery } from "@/components/templates/TemplateGallery";
import { CustomTemplateList } from "@/components/templates/CustomTemplateList";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const ws = await getMyWorkspace();
  if (!ws) redirect("/onboarding");
  const custom = await listCustomTemplates();

  return (
    <div className="space-y-10">
      <TemplateGallery workspace={ws} defaultTemplateId={ws.default_template_id ?? "jasa"} />
      <CustomTemplateList workspace={ws} templates={custom} />
    </div>
  );
}
