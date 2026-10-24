"use client";

import * as React from "react";
import { User, Hash, CreditCard } from "lucide-react";
import { Card, CardContent, Input, Textarea, Button, FileUpload, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { saveWorkspaceProfile, saveNumbering, uploadWorkspaceLogo, type Workspace } from "@/lib/workspace/actions";
import { BillingPanel } from "./BillingPanel";
import type { BillingInfo } from "@/lib/billing/constants";

type Tab = "profil" | "penomoran" | "billing";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "profil", label: "Profil Usaha", icon: <User className="h-4 w-4" /> },
  { id: "penomoran", label: "Penomoran", icon: <Hash className="h-4 w-4" /> },
  { id: "billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
];

export function SettingsTabs({
  workspace,
  billing,
  snapJsUrl,
  clientKey,
  initialTab = "profil",
}: {
  workspace: Workspace;
  billing: BillingInfo;
  snapJsUrl: string;
  clientKey: string;
  initialTab?: Tab;
}) {
  const toast = useToast();
  const [tab, setTab] = React.useState<Tab>(initialTab);

  // Profil
  const [name, setName] = React.useState(workspace.name ?? "");
  const [address, setAddress] = React.useState(workspace.address ?? "");
  const [phone, setPhone] = React.useState(workspace.phone ?? "");
  const [email, setEmail] = React.useState(workspace.email ?? "");
  const [website, setWebsite] = React.useState(workspace.website ?? "");
  const [bankName, setBankName] = React.useState(workspace.bank_name ?? "");
  const [accountNumber, setAccountNumber] = React.useState(workspace.account_number ?? "");
  const [accountHolder, setAccountHolder] = React.useState(workspace.account_holder ?? "");
  const [signatory, setSignatory] = React.useState(workspace.signatory ?? "");
  const [terms, setTerms] = React.useState(workspace.terms ?? "");
  const [logoUrl, setLogoUrl] = React.useState<string | null>(workspace.logo_url ?? null);
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Penomoran
  const [prefix, setPrefix] = React.useState(workspace.invoice_prefix ?? "INV-");
  const [nextNo, setNextNo] = React.useState(String(workspace.next_invoice_number ?? 1));
  const [savingNo, setSavingNo] = React.useState(false);

  async function saveProfile() {
    setSavingProfile(true);
    const res = await saveWorkspaceProfile({
      name,
      address,
      bankAccount: workspace.bank_account ?? "", // pertahankan data lama
      phone,
      email,
      website,
      signatory,
      bankName,
      accountNumber,
      accountHolder,
      terms,
    });
    if (res.error) {
      setSavingProfile(false);
      return toast.error("Gagal", res.error);
    }
    // Logo opsional: hanya diunggah bila user memilih file baru.
    if (logoFile) {
      const fd = new FormData();
      fd.append("logo", logoFile);
      const up = await uploadWorkspaceLogo(fd);
      if (up.error) {
        setSavingProfile(false);
        return toast.error("Profil tersimpan, logo gagal", up.error);
      }
      if (up.logoUrl) setLogoUrl(up.logoUrl);
      setLogoFile(null);
    }
    setSavingProfile(false);
    toast.success("Profil tersimpan");
  }
  async function saveNo() {
    setSavingNo(true);
    const res = await saveNumbering({ prefix, nextNumber: Number(nextNo) || 1 });
    setSavingNo(false);
    if (res.error) return toast.error("Gagal", res.error);
    toast.success("Penomoran tersimpan");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto rounded-btn border border-line bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-btn px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              tab === t.id ? "bg-primary-soft text-primary" : "text-muted hover:text-ink"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profil" && (
        <Card>
          <CardContent className="max-w-xl space-y-4">
            <Input label="Nama usaha" value={name} onChange={(e) => setName(e.target.value)} required helper="Tampil di invoice & sidebar. Boleh diubah kapan saja." />

            <div className="space-y-1.5">
              <span className="block text-[13px] font-medium text-ink">Logo usaha <span className="font-normal text-muted">(opsional)</span></span>
              {logoUrl && !logoFile && (
                <div className="flex items-center gap-3 rounded-input border border-line bg-surface p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Logo usaha saat ini" className="h-12 w-12 rounded-btn border border-line object-contain" />
                  <p className="text-sm text-muted">Logo saat ini. Unggah file baru untuk mengganti.</p>
                </div>
              )}
              <FileUpload
                helper="PNG, JPG, atau SVG · maks 2 MB. Biarkan kosong untuk mempertahankan logo saat ini."
                maxSizeMB={2}
                onFileSelect={setLogoFile}
              />
            </div>

            <Textarea label="Alamat" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />

            {/* Kontak — tampil di "Invoice From" & footer invoice */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Telepon" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usaha@email.com" />
              <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="usaha.com" />
            </div>

            {/* Payment Info — tampil di blok "Payment Info" invoice */}
            <div className="space-y-3 rounded-btn border border-line bg-canvas p-3">
              <p className="text-[13px] font-semibold text-ink">Info pembayaran</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="Nama bank" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="mis. BCA" />
                <Input label="No. rekening" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="1234567890" />
                <Input label="Atas nama" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="Nama pemilik rekening" />
              </div>
            </div>

            <Input label="Nama penandatangan (opsional)" value={signatory} onChange={(e) => setSignatory(e.target.value)} placeholder="mis. Budi Santoso" helper="Tampil di atas garis “Authorised Sign” pada invoice." />
            <Textarea label="Syarat & ketentuan default (opsional)" value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} placeholder="mis. Pembayaran paling lambat 14 hari setelah invoice diterbitkan." helper="Dipakai otomatis pada invoice baru; bisa diubah per invoice." />

            <div className="flex justify-end">
              <Button onClick={saveProfile} loading={savingProfile}>Simpan perubahan</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "penomoran" && (
        <Card>
          <CardContent className="max-w-xl space-y-4">
            <Input label="Prefix nomor invoice" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="INV-" helper="Dipakai untuk invoice berikutnya, mis. INV-0001." />
            <Input label="Nomor urut berikutnya" type="number" min={1} value={nextNo} onChange={(e) => setNextNo(e.target.value)} helper="Sistem menjaga nomor unik & berurutan." />
            <div className="flex justify-end">
              <Button onClick={saveNo} loading={savingNo}>Simpan perubahan</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "billing" && <BillingPanel billing={billing} snapJsUrl={snapJsUrl} clientKey={clientKey} />}
    </div>
  );
}
