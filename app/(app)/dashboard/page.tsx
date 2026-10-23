import { getDashboardData } from "@/lib/dashboard/actions";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardView data={data} />;
}
