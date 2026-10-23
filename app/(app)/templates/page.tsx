import { redirect } from "next/navigation";
import { getMyWorkspace } from "@/lib/workspace/actions";
import { TemplateGallery } from "@/components/templates/TemplateGallery";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const ws = await getMyWorkspace();
  if (!ws) redirect("/onboarding");

  return <TemplateGallery workspace={ws} defaultTemplateId={ws.default_template_id ?? "jasa"} />;
}
