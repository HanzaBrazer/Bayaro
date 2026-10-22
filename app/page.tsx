import Link from "next/link";
import { ArrowRight, Activity, FileText, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-2xl space-y-6 rounded-card border border-line bg-surface p-8 text-center shadow-card md:p-12">
        {/* Brand */}
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Generator invoice &amp; kwitansi
          </h1>
          <p className="mx-auto max-w-lg text-base text-muted">
            Platform untuk freelancer dan UMKM Indonesia. Isi form, dokumen rapi,
            tersimpan terpusat, dan dibagikan lewat link.
          </p>
        </div>

        {/* Highlights fondasi */}
        <div className="grid grid-cols-1 gap-4 pt-2 text-left md:grid-cols-3">
          <div className="space-y-1 rounded-btn border border-line bg-canvas/60 p-4">
            <FileText className="mb-2 h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-ink">Satu template</h3>
            <p className="text-xs text-muted">HTML/CSS identik untuk preview, PDF, dan link browser.</p>
          </div>
          <div className="space-y-1 rounded-btn border border-line bg-canvas/60 p-4">
            <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-ink">Design tokens siap</h3>
            <p className="text-xs text-muted">Plus Jakarta Sans, IBM Plex Mono, &amp; palet warna terstandar.</p>
          </div>
          <div className="space-y-1 rounded-btn border border-line bg-canvas/60 p-4">
            <Activity className="mb-2 h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-ink">Environment terpipa</h3>
            <p className="text-xs text-muted">Supabase &amp; Midtrans siap lewat environment variables.</p>
          </div>
        </div>

        {/* CTA ke halaman status */}
        <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
          <Link
            href="/health"
            className="inline-flex w-full items-center justify-center gap-2 rounded-btn bg-primary px-6 py-2.5 font-medium text-surface shadow-sm transition-all hover:bg-primary-hover active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
          >
            <span>Cek status environment</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <footer className="mt-8 text-xs text-muted">
        Bayaro &copy; 2026 — dibuat untuk UMKM &amp; freelancer Indonesia
      </footer>
    </main>
  );
}
