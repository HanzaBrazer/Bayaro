import { LayoutTemplate } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function TemplatesPage() {
  return (
    <PagePlaceholder
      icon={<LayoutTemplate className="h-6 w-6" />}
      title="Template"
      description="Galeri template invoice (Jasa, Barang, Sewa, Kwitansi) dibangun di Langkah 8."
    />
  );
}
