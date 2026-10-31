import { notFound, redirect } from "next/navigation";
import { getMyWorkspace } from "@/lib/workspace/actions";
import { followRecordWorkspace } from "@/lib/workspace/active";
import { getCustomTemplate } from "@/lib/custom-template/actions";
import { TemplateBuilder } from "@/components/templates/builder/TemplateBuilder";

export const dynamic = "force-dynamic";

export default async function CustomTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Link dari workspace lain milik user → pindah dulu, lalu muat ulang.
  if (await followRecordWorkspace("custom_templates", id)) redirect(`/templates/custom/${id}`);
  const ws = await getMyWorkspace();
  if (!ws) redirect("/onboarding");
  const tpl = await getCustomTemplate(id);
  if (!tpl) notFound();

  return <TemplateBuilder key={tpl.id} template={tpl} workspace={ws} />;
}
