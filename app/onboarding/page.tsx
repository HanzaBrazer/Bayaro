import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
      <Logo />
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Siapkan usahamu</h1>
        <p className="max-w-sm text-sm text-muted">
          Onboarding profil usaha (nama, logo, alamat, rekening, prefix) dibangun di Langkah 3.
        </p>
      </div>
      <Link href="/invoices" className="text-sm font-medium text-primary hover:text-primary-hover">
        Lewati ke aplikasi →
      </Link>
    </main>
  );
}
