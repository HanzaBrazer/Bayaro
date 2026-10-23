import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { getQuotaStatus } from "@/lib/plan/actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const quota = await getQuotaStatus();

  return (
    <div className="flex min-h-screen bg-canvas">
      <AppSidebar quota={quota} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar quota={quota} />
        <main className="mx-auto w-full max-w-[1200px] flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
