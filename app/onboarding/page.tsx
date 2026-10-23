import { getMyWorkspace } from "@/lib/workspace/actions";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { BayaroMark } from "@/components/brand/Logo";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const workspace = await getMyWorkspace();

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-card bg-ink text-bone">
            <BayaroMark className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Siapkan usahamu</h1>
          <p className="mt-1 text-sm text-muted">
            Lengkapi profil usaha agar invoice-mu rapi sejak awal. Bisa dilewati &amp; diisi nanti di
            Pengaturan.
          </p>
        </div>

        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <OnboardingForm workspace={workspace} />
        </div>
      </div>
    </main>
  );
}
