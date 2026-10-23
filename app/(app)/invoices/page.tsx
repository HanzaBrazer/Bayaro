import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function InvoicesPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/invoices/new"
          className="inline-flex h-10 items-center gap-2 rounded-btn bg-primary px-4 text-sm font-medium text-surface shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Invoice Baru
        </Link>
      </div>
      <PagePlaceholder
        icon={<FileText className="h-6 w-6" />}
        title="Daftar invoice"
        description="Tabel daftar invoice (cari, filter, aksi baris) dibangun di Langkah 6. Sementara, buat invoice lewat tombol di atas."
      />
    </div>
  );
}
