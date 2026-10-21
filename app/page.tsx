import Link from "next/link";
import { ArrowRight, FileText, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-2xl bg-surface border border-line rounded-card p-8 md:p-12 shadow-card text-center space-y-6">
        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fase Fondasi & Scaffold</span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Bayaro
          </h1>
          <p className="text-muted text-base max-w-lg mx-auto">
            Generator invoice & kwitansi rapi untuk freelancer dan UMKM Indonesia.
            Fondasi arsitektur Next.js App Router dan sistem desain telah siap.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
          <div className="p-4 rounded-btn border border-line bg-canvas/60 space-y-1">
            <FileText className="w-5 h-5 text-primary mb-2" />
            <h3 className="text-sm font-semibold text-ink">Satu Template</h3>
            <p className="text-xs text-muted">HTML/CSS identik untuk preview, PDF, dan link browser.</p>
          </div>
          <div className="p-4 rounded-btn border border-line bg-canvas/60 space-y-1">
            <CheckCircle2 className="w-5 h-5 text-primary mb-2" />
            <h3 className="text-sm font-semibold text-ink">Design Tokens</h3>
            <p className="text-xs text-muted">Plus Jakarta Sans, IBM Plex Mono, & palet warna terstandar.</p>
          </div>
          <div className="p-4 rounded-btn border border-line bg-canvas/60 space-y-1">
            <ShieldCheck className="w-5 h-5 text-primary mb-2" />
            <h3 className="text-sm font-semibold text-ink">Siap Fase Lanjut</h3>
            <p className="text-xs text-muted">Supabase Client & Midtrans terstruktur rapi.</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dev/components"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-btn bg-primary text-surface font-medium hover:bg-primary-hover active:scale-[0.98] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <span>Buka Showcase Komponen (/dev/components)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <footer className="mt-8 text-xs text-muted">
        Bayaro &copy; 2026 — Dibuat untuk UMKM & Freelancer Indonesia
      </footer>
    </main>
  );
}
