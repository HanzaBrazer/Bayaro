import { LayoutGrid } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function DashboardPage() {
  return (
    <PagePlaceholder
      icon={<LayoutGrid className="h-6 w-6" />}
      title="Dashboard"
      description="Ringkasan statistik, chart nilai invoice, dan rincian kategori dibangun di Langkah 11."
    />
  );
}
