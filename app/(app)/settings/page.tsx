import { Settings } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function SettingsPage() {
  return (
    <PagePlaceholder
      icon={<Settings className="h-6 w-6" />}
      title="Pengaturan"
      description="Profil usaha, penomoran, dan billing (Midtrans) dibangun di Langkah 3 & 10."
    />
  );
}
