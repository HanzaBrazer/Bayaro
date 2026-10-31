"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ImagePlus, X } from "lucide-react";
import { Button, Input, Modal, Textarea, useToast } from "@/components/ui";
import { BayaroMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { createWorkspace, setWorkspaceLogoUrl, uploadWorkspaceLogo } from "@/lib/workspace/actions";
import { BUSINESS_TYPES, previewNumber, type BusinessTypeKey } from "@/lib/workspace/business";

const MAX_LOGO = 2 * 1024 * 1024;

type Form = {
  businessType: BusinessTypeKey | "";
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  signatory: string;
  prefix: string;
  startNumber: string;
};

const EMPTY: Form = {
  businessType: "",
  name: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  bankName: "",
  accountNumber: "",
  accountHolder: "",
  signatory: "",
  prefix: "INV-",
  startNumber: "1",
};

const STEPS = [
  { title: "Usaha apa yang ingin kamu kelola?", hint: "Kami pilihkan template invoice yang paling cocok." },
  { title: "Kenalkan usahamu", hint: "Nama & logo tampil di setiap invoice workspace ini." },
  { title: "Bagaimana klien menghubungimu?", hint: "Opsional — bisa dilengkapi nanti di Pengaturan." },
  { title: "Ke mana klien membayar?", hint: "Opsional — rekening ini tampil di invoice." },
  { title: "Atur nomor invoice", hint: "Nomor workspace ini berjalan sendiri, terpisah dari workspace lain." },
] as const;

/** Wizard pembuatan workspace (bisnis baru), gaya onboarding ClickUp. */
export function NewWorkspaceWizard({ hasWorkspaces }: { hasWorkspaces: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState<Form>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof Form, string>>>({});
  const [logo, setLogo] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const touched = JSON.stringify(form) !== JSON.stringify(EMPTY) || !!logo;
  const last = step === STEPS.length - 1;
  const set = (patch: Partial<Form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k as keyof Form];
      return next;
    });
  };

  // Pindahkan fokus ke judul langkah agar pembaca layar mengumumkannya.
  React.useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  React.useEffect(() => () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  // Peringatan bawaan browser bila menutup tab saat data sudah diisi.
  React.useEffect(() => {
    if (!touched || saving) return;
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [touched, saving]);

  function validate(s: number): boolean {
    const e: Partial<Record<keyof Form, string>> = {};
    if (s === 0 && !form.businessType) e.businessType = "Pilih salah satu jenis usaha.";
    if (s === 1) {
      if (!form.name.trim()) e.name = "Nama usaha wajib diisi.";
      else if (form.name.trim().length > 80) e.name = "Nama usaha maksimal 80 karakter.";
    }
    if (s === 2 && form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = "Format email tidak valid.";
    }
    if (s === 4) {
      const n = Number(form.startNumber);
      if (!Number.isInteger(n) || n < 1) e.startNumber = "Nomor mulai minimal 1.";
      if (form.prefix.trim().length > 12) e.prefix = "Prefix maksimal 12 karakter.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const next = () => validate(step) && setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => (step === 0 ? leave() : setStep((s) => s - 1));
  const skip = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  function leave() {
    if (touched) setCancelOpen(true);
    else exit();
  }
  function exit() {
    if (hasWorkspaces) router.back();
    else router.push("/dashboard");
  }

  function pickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(f.type)) return toast.error("Logo ditolak", "Format harus PNG, JPG, SVG, atau WebP.");
    if (f.size > MAX_LOGO) return toast.error("Logo ditolak", "Ukuran logo maksimal 2 MB.");
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogo(f);
    setLogoPreview(URL.createObjectURL(f));
  }

  /** Logo diunggah setelah workspace ada (butuh id untuk path), pola sama dengan Pengaturan. */
  async function uploadLogo(workspaceId: string): Promise<string | null> {
    if (!logo) return null;
    const ext = (logo.name.split(".").pop() || "png").toLowerCase();
    const path = `${workspaceId}/logo-${Date.now()}.${ext}`;
    const sb = createBrowserSupabase();
    const { error } = await sb.storage.from("workspace-logos").upload(path, logo, { upsert: true, contentType: logo.type });
    if (!error) {
      const url = sb.storage.from("workspace-logos").getPublicUrl(path).data.publicUrl;
      const saved = await setWorkspaceLogoUrl(url);
      return saved.error;
    }
    const fd = new FormData();
    fd.append("logo", logo);
    const res = await uploadWorkspaceLogo(fd);
    return res.error;
  }

  async function submit() {
    if (saving || !validate(step)) return;
    setSaving(true);
    try {
      const res = await createWorkspace({
        ...form,
        businessType: form.businessType as BusinessTypeKey,
        startNumber: Number(form.startNumber),
      });
      if (res.error && !res.id) {
        // Arahkan ke langkah tempat field bermasalah berada.
        const at: Record<string, number> = { businessType: 0, name: 1, email: 2, phone: 2, address: 2, website: 2 };
        if (res.field && res.field in at) {
          setStep(at[res.field]);
          setErrors({ [res.field]: res.error });
        }
        return toast.error("Gagal membuat workspace", res.error);
      }
      if (res.error) {
        toast.info("Workspace dibuat", res.error);
        router.push("/dashboard");
        router.refresh();
        return;
      }
      const logoErr = res.id ? await uploadLogo(res.id) : null;
      if (logoErr) toast.info(`Workspace ${form.name.trim()} siap`, `Logo gagal diunggah: ${logoErr} Bisa diulang di Pengaturan.`);
      else toast.success(`Workspace ${form.name.trim()} siap`, "Mulai buat invoice pertamamu.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Gagal membuat workspace", "Jaringan bermasalah. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;
  const optionalStep = step === 2 || step === 3;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Bar atas */}
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <span className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-card bg-ink text-bone">
            <BayaroMark className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-ink">Bayaro</span>
        </span>
        <button
          type="button"
          onClick={leave}
          aria-label="Tutup pembuatan workspace"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-muted shadow-card transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-28 pt-4 sm:items-center sm:px-8 sm:pb-8">
        <div className="w-full max-w-3xl rounded-[20px] border border-line bg-surface shadow-card">
          <div className="px-5 pb-6 pt-8 sm:px-10 sm:pt-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Workspace baru · Langkah {step + 1} dari {STEPS.length}
            </p>
            <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-2xl font-bold tracking-tight text-ink outline-none sm:text-[28px]">
              {STEPS[step].title}
            </h1>
            <p className="mt-1 text-sm text-muted">{STEPS[step].hint}</p>

            <div className="mt-7 min-h-[200px]">
              {step === 0 && (
                <div>
                  <div role="radiogroup" aria-label="Jenis usaha" className="flex flex-wrap gap-2.5">
                    {BUSINESS_TYPES.map((b) => {
                      const on = form.businessType === b.key;
                      return (
                        <button
                          key={b.key}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => set({ businessType: b.key })}
                          className={cn(
                            "min-h-[44px] rounded-full border px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                            on ? "border-ink bg-ink text-bone" : "border-line bg-surface text-ink hover:border-ink/40"
                          )}
                        >
                          {b.label}
                        </button>
                      );
                    })}
                  </div>
                  {errors.businessType && (
                    <p role="alert" className="mt-3 text-sm text-danger">
                      {errors.businessType}
                    </p>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-5 sm:grid-cols-[1fr_160px]">
                  <Input
                    label="Nama usaha"
                    value={form.name}
                    onChange={(e) => set({ name: e.target.value })}
                    error={errors.name}
                    placeholder="mis. Lebah Studio"
                    maxLength={80}
                    autoFocus
                    required
                  />
                  <div className="space-y-1.5">
                    <span className="block text-[13px] font-medium text-ink">Logo (opsional)</span>
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={pickLogo} className="sr-only" aria-label="Pilih logo usaha" />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex h-[104px] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-card border border-dashed border-line text-xs text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {logoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoPreview} alt="Pratinjau logo" className="h-full w-full object-contain p-2" />
                      ) : (
                        <>
                          <ImagePlus className="h-5 w-5" />
                          Unggah logo
                        </>
                      )}
                    </button>
                    {logo && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogo(null);
                          setLogoPreview(null);
                        }}
                        className="text-xs font-medium text-danger hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        Hapus logo
                      </button>
                    )}
                    <p className="text-[11px] text-muted">PNG/JPG/SVG, maks 2 MB.</p>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Textarea
                    label="Alamat"
                    value={form.address}
                    onChange={(e) => set({ address: e.target.value })}
                    rows={3}
                    maxLength={300}
                    containerClassName="sm:col-span-2"
                  />
                  <Input label="Telepon" value={form.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" maxLength={30} />
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set({ email: e.target.value })}
                    error={errors.email}
                    maxLength={120}
                  />
                  <Input label="Website" value={form.website} onChange={(e) => set({ website: e.target.value })} placeholder="mis. lebahstudio.co" maxLength={120} containerClassName="sm:col-span-2" />
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Nama bank" value={form.bankName} onChange={(e) => set({ bankName: e.target.value })} placeholder="mis. BCA" maxLength={60} />
                  <Input label="No. rekening" value={form.accountNumber} onChange={(e) => set({ accountNumber: e.target.value })} inputMode="numeric" maxLength={40} />
                  <Input label="Atas nama" value={form.accountHolder} onChange={(e) => set({ accountHolder: e.target.value })} maxLength={80} />
                  <Input label="Penandatangan" value={form.signatory} onChange={(e) => set({ signatory: e.target.value })} helper="Nama di blok tanda tangan invoice." maxLength={80} />
                </div>
              )}

              {step === 4 && (
                <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <Input
                    label="Prefix"
                    value={form.prefix}
                    onChange={(e) => set({ prefix: e.target.value })}
                    error={errors.prefix}
                    maxLength={12}
                    className="font-mono"
                  />
                  <Input
                    label="Nomor mulai"
                    value={form.startNumber}
                    onChange={(e) => set({ startNumber: e.target.value.replace(/\D/g, "") })}
                    error={errors.startNumber}
                    inputMode="numeric"
                    maxLength={6}
                    className="font-mono"
                  />
                  <div className="rounded-input border border-line bg-canvas px-4 py-2" aria-live="polite">
                    <p className="text-[11px] text-muted">Invoice pertama</p>
                    <p className="font-mono text-base font-semibold text-ink">
                      {previewNumber(form.prefix.trim(), Number(form.startNumber))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress + navigasi (menempel di bawah layar HP) */}
          <div className="h-1 w-full bg-line" aria-hidden>
            <div className="h-full bg-ink transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-2 border-t border-line bg-surface px-4 py-3 sm:static sm:rounded-b-[20px] sm:border-0 sm:px-10 sm:py-5">
            <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={back} disabled={saving}>
              {step === 0 ? "Batal" : "Kembali"}
            </Button>
            <div className="flex items-center gap-2">
              {optionalStep && (
                <Button variant="ghost" onClick={skip} disabled={saving}>
                  Lewati
                </Button>
              )}
              {last ? (
                <Button onClick={submit} loading={saving} leftIcon={<Check className="h-4 w-4" />}>
                  Buat workspace
                </Button>
              ) : (
                <Button
                  onClick={next}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  disabled={(step === 0 && !form.businessType) || (step === 1 && !form.name.trim())}
                >
                  Lanjut
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        size="sm"
        title="Batalkan pembuatan workspace?"
        description="Data yang sudah kamu isi tidak akan disimpan."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              Lanjut mengisi
            </Button>
            <Button className="bg-danger hover:bg-danger/90" onClick={exit}>
              Batalkan
            </Button>
          </>
        }
      />
    </div>
  );
}
