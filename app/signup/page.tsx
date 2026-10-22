import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
      <Logo />
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Daftar</h1>
        <p className="max-w-sm text-sm text-muted">
          Form pendaftaran (nama, email, password, S&amp;K) dibangun di Langkah 2.
        </p>
      </div>
      <Link href="/login" className="text-sm font-medium text-primary hover:text-primary-hover">
        Sudah punya akun? Masuk
      </Link>
    </main>
  );
}
