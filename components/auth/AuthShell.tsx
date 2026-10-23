import * as React from "react";
import { Check } from "lucide-react";
import { BayaroMark } from "@/components/brand/Logo";

const BULLETS = ["Template invoice profesional", "Simpan & bagikan lewat link", "Export PDF & PNG"];

/**
 * Split-screen auth (design §5.1): panel gelap `ink` + logo `bone` kiri,
 * form di kanan. Panel disembunyikan di layar kecil.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Panel brand (desktop) */}
      <aside className="hidden w-1/2 flex-col justify-between bg-ink p-10 text-bone lg:flex xl:p-14">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-card bg-bone/10 text-bone">
            <BayaroMark className="h-6 w-6" />
          </span>
          <span className="text-xl font-bold tracking-tight">Bayaro</span>
        </div>

        <div className="space-y-6">
          <h2 className="max-w-sm text-3xl font-bold leading-tight">
            Invoice rapi dalam hitungan menit.
          </h2>
          <ul className="space-y-3">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-center gap-3 text-bone/80">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-surface">
                  <Check className="h-3 w-3" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-bone/50">Untuk freelancer &amp; UMKM Indonesia</p>
      </aside>

      {/* Form */}
      <main className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-card bg-ink text-bone">
              <BayaroMark className="h-6 w-6" />
            </span>
            <span className="text-xl font-bold tracking-tight text-ink">Bayaro</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
