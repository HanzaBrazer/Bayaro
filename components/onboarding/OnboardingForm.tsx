"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { saveOnboardingAction, skipOnboardingAction, type OnboardingState, type Workspace } from "@/lib/workspace/actions";
import { Input, Textarea, FileUpload, Button, useToast } from "@/components/ui";

const initial: OnboardingState = { error: null };

export function OnboardingForm({ workspace }: { workspace: Workspace | null }) {
  const [state, action, pending] = useActionState(saveOnboardingAction, initial);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (state.success) {
      toast.success("Profil usaha tersimpan");
      router.push("/invoices");
    }
  }, [state.success, router, toast]);

  // Nama default dari trigger "Usaha Saya" dibiarkan kosong agar user mengisi sendiri.
  const [name, setName] = useState(workspace?.name && workspace.name !== "Usaha Saya" ? workspace.name : "");
  const [address, setAddress] = useState(workspace?.address ?? "");
  const [bankAccount, setBankAccount] = useState(workspace?.bank_account ?? "");
  const [prefix, setPrefix] = useState(workspace?.invoice_prefix ?? "INV-");

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-input border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <Input
        label="Nama usaha"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="mis. Studio Gandaria"
        helper="Tampil di invoice & pengaturan."
      />

      <FileUpload label="Logo usaha" name="logo" helper="Tampil di pojok invoice. PNG/JPG/SVG, maks 2 MB." maxSizeMB={2} />

      <Textarea
        label="Alamat"
        name="address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Alamat usaha (blok pengirim pada invoice)"
      />

      <Input
        label="No. rekening / bank"
        name="bank_account"
        value={bankAccount}
        onChange={(e) => setBankAccount(e.target.value)}
        placeholder="mis. BCA 1234567890 a.n. Nama"
      />

      <Input
        label="Prefix nomor invoice"
        name="invoice_prefix"
        value={prefix}
        onChange={(e) => setPrefix(e.target.value)}
        placeholder="INV-"
        helper="Dipakai untuk penomoran, mis. INV-0001."
      />

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={pending} className="flex-1">
          Simpan &amp; mulai
        </Button>
        <button
          type="button"
          onClick={() => skipOnboardingAction()}
          className="inline-flex h-10 items-center justify-center rounded-btn px-4 text-sm font-medium text-ink-soft transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Lewati
        </button>
      </div>
    </form>
  );
}
