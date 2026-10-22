import { FileText } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function InvoicesPage() {
  return (
    <PagePlaceholder
      icon={<FileText className="h-6 w-6" />}
      title="Invoice"
      description="Daftar invoice, editor + live preview, dan export dibangun di Langkah 4–6."
    />
  );
}
