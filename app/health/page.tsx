import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, PlugZap } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

// Baca env per-request (bukan di-cache statis).
export const dynamic = "force-dynamic";

type EnvItem = {
  key: string;
  label: string;
  secret: boolean;
  requiredNow: boolean;
};

const ENV_ITEMS: EnvItem[] = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", label: "URL project Supabase", secret: false, requiredNow: false },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", label: "Supabase anon key", secret: true, requiredNow: false },
  { key: "SUPABASE_SERVICE_ROLE_KEY", label: "Supabase service role key", secret: true, requiredNow: false },
  { key: "MIDTRANS_SERVER_KEY", label: "Midtrans server key", secret: true, requiredNow: false },
  { key: "NEXT_PUBLIC_MIDTRANS_CLIENT_KEY", label: "Midtrans client key", secret: false, requiredNow: false },
  { key: "MIDTRANS_IS_PRODUCTION", label: "Mode Midtrans (false = sandbox)", secret: false, requiredNow: true },
  { key: "NEXT_PUBLIC_APP_URL", label: "URL aplikasi", secret: false, requiredNow: true },
  { key: "APP_TIMEZONE", label: "Timezone kuota (WIB)", secret: false, requiredNow: true },
];

function isSet(v: string | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function maskValue(v: string): string {
  if (v.length <= 8) return "••••";
  return `${v.slice(0, 4)}…${v.slice(-2)}`;
}

type SupabaseStatus = {
  state: "ok" | "fail" | "skip";
  detail: string;
};

async function checkSupabase(): Promise<SupabaseStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSet(url) || !isSet(anon)) {
    return { state: "skip", detail: "URL / anon key belum diisi di .env.local — koneksi dilewati." };
  }
  // Hindari percobaan jaringan ke nilai placeholder yang pasti gagal.
  if (url!.includes("placeholder")) {
    return { state: "skip", detail: "Masih memakai nilai placeholder — isi nilai asli Supabase dulu." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${url!.replace(/\/$/, "")}/auth/v1/health`, {
      headers: { apikey: anon! },
      signal: controller.signal,
      cache: "no-store",
    });
    if (res.ok) {
      return { state: "ok", detail: "Supabase merespons (auth/v1/health 200)." };
    }
    return { state: "fail", detail: `Supabase membalas status ${res.status}. Cek URL/key.` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "kesalahan tak dikenal";
    return { state: "fail", detail: `Gagal menghubungi Supabase: ${msg}.` };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function HealthPage() {
  const items = ENV_ITEMS.map((item) => {
    const raw = process.env[item.key];
    const set = isSet(raw);
    return {
      ...item,
      set,
      display: set ? (item.secret ? maskValue(raw!.trim()) : raw!.trim()) : "—",
    };
  });

  const requiredMissing = items.filter((i) => i.requiredNow && !i.set).length;
  const supabase = await checkSupabase();

  return (
    <main className="mx-auto max-w-3xl p-6 md:p-12">
      <div className="mb-6 flex items-center justify-between">
        <Logo />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-btn px-3 py-1.5 text-sm text-muted transition-colors hover:bg-canvas hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Beranda
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-ink">Status environment</h1>
      <p className="mt-1 text-sm text-muted">
        Halaman diagnostik fondasi. Nilai rahasia ditampilkan tersamar; app tetap jalan walau
        env belum terisi.
      </p>

      {/* Ringkasan env */}
      <section className="mt-6 overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-base font-semibold text-ink">Variabel environment</h2>
          <span
            className={
              requiredMissing === 0
                ? "rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary"
                : "rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning"
            }
          >
            {requiredMissing === 0 ? "Wajib terisi: lengkap" : `${requiredMissing} wajib belum terisi`}
          </span>
        </header>
        <ul className="divide-y divide-line">
          {items.map((i) => (
            <li key={i.key} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {i.set ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  ) : i.requiredNow ? (
                    <XCircle className="h-4 w-4 shrink-0 text-danger" aria-hidden />
                  ) : (
                    <MinusCircle className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                  )}
                  <code className="truncate font-mono text-sm text-ink">{i.key}</code>
                </div>
                <p className="ml-6 text-xs text-muted">{i.label}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="font-mono text-xs text-ink-soft">{i.display}</span>
                <p className="text-[11px] text-muted">
                  {i.set ? "terbaca" : i.requiredNow ? "belum (wajib)" : "belum (opsional)"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Koneksi Supabase */}
      <section className="mt-5 rounded-card border border-line bg-surface p-5 shadow-card">
        <div className="flex items-start gap-3">
          <span
            className={
              supabase.state === "ok"
                ? "mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary"
                : supabase.state === "fail"
                  ? "mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-danger-soft text-danger"
                  : "mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-muted"
            }
          >
            <PlugZap className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">Koneksi Supabase</h2>
            <p className="mt-0.5 text-sm text-muted">
              {supabase.state === "ok" && "Terhubung."}
              {supabase.state === "fail" && "Belum terhubung."}
              {supabase.state === "skip" && "Dilewati."}{" "}
              {supabase.detail}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
