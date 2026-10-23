import { redirect } from "next/navigation";
import { getMyWorkspace } from "@/lib/workspace/actions";
import { getBilling } from "@/lib/billing/actions";
import { midtransConfig, snapJsUrl } from "@/lib/midtrans/config";
import { SettingsTabs } from "@/components/settings/SettingsTabs";

export const dynamic = "force-dynamic";

type Tab = "profil" | "penomoran" | "billing";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const ws = await getMyWorkspace();
  if (!ws) redirect("/onboarding");

  const [{ tab }, billing] = await Promise.all([searchParams, getBilling()]);
  const initialTab: Tab = tab === "penomoran" || tab === "billing" ? tab : "profil";

  return (
    <SettingsTabs
      workspace={ws}
      billing={billing}
      snapJsUrl={snapJsUrl}
      clientKey={midtransConfig.clientKey}
      initialTab={initialTab}
    />
  );
}
