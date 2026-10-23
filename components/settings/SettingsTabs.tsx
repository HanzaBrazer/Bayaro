"use client";

import * as React from "react";
import { User, Hash, CreditCard } from "lucide-react";
import { Card, CardContent, Input, Textarea, Button, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { saveWorkspaceProfile, saveNumbering, type Workspace } from "@/lib/workspace/actions";
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
  const [bank, setBank] = React.useState(workspace.bank_account ?? "");
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Penomoran
  const [prefix, setPrefix] = React.useState(workspace.invoice_prefix ?? "INV-");
  const [nextNo, setNextNo] = React.useState(String(workspace.next_invoice_number ?? 1));
  const [savingNo, setSavingNo] = React.useState(false);

  async function saveProfile() {
    setSavingProfile(true);
    const res = await saveWorkspaceProfile({ name, address, bankAccount: bank });
    setSavingProfile(false);
    if (res.error) return toast.error("Gagal", res.error);
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
            <Input label="Nama usaha" value={name} onChange={(e) => setName(e.target.value)} required />
            <Textarea label="Alamat" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
            <Input label="No. rekening / bank" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="mis. BCA 1234567890 a.n. Nama" />
            <div className="flex justify-end">
              <Button onClick={saveProfile} loading={savingProfile}>Simpan perubahan</Button>
            </div>
            <p className="text-xs text-muted">Logo bisa diperbarui lewat halaman onboarding (akan ditambahkan di sini kemudian).</p>
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
