import { Users } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function ClientsPage() {
  return (
    <PagePlaceholder
      icon={<Users className="h-6 w-6" />}
      title="Klien"
      description="Daftar klien tersimpan dan form tambah klien dibangun di Langkah 7."
    />
  );
}
