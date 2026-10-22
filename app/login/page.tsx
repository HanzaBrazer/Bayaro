import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
      <Logo />
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Masuk</h1>
        <p className="max-w-sm text-sm text-muted">
          Halaman login split-screen (email/password + Google) dibangun di Langkah 2.
        </p>
      </div>
      <Link href="/invoices" className="text-sm font-medium text-primary hover:text-primary-hover">
        Lanjut ke aplikasi →
      </Link>
    </main>
  );
}
