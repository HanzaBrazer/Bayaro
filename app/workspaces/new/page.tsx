import type { Metadata } from "next";
import { listMyWorkspaces } from "@/lib/workspace/actions";
import { NewWorkspaceWizard } from "@/components/workspace/NewWorkspaceWizard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Buat workspace — Bayaro" };

export default async function NewWorkspacePage() {
  const { workspaces } = await listMyWorkspaces();
  return <NewWorkspaceWizard hasWorkspaces={workspaces.length > 0} />;
}
