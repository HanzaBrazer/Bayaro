"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Drawer, Input, Textarea, Button, useToast } from "@/components/ui";
import {
  createClientRecord,
  updateClientRecord,
  type ClientRecord,
} from "@/lib/client/actions";

export function ClientDrawer({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial?: ClientRecord | null;
  onSaved?: (client: ClientRecord) => void;
}) {
  const toast = useToast();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Sinkronkan saat drawer dibuka / target edit berubah.
  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setEmail(initial?.email ?? "");
      setPhone(initial?.phone ?? "");
      setAddress(initial?.address ?? "");
      setError(null);
    }
  }, [open, initial]);

  async function save() {
    setSaving(true);
    setError(null);
    const input = { name, email, phone, address };
    if (initial) {
      const res = await updateClientRecord(initial.id, input);
      setSaving(false);
      if (res.error) return setError(res.error);
      toast.success("Klien diperbarui");
      onSaved?.({ id: initial.id, name: name.trim(), email: email.trim() || null, phone: phone.trim() || null, address: address.trim() || null });
      onClose();
    } else {
      const res = await createClientRecord(input);
      setSaving(false);
      if (res.error || !res.client) return setError(res.error ?? "Gagal menyimpan klien.");
      toast.success("Klien tersimpan");
      onSaved?.(res.client);
      onClose();
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initial ? "Edit klien" : "Klien baru"}
      description="Data klien dipakai ulang di invoice."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Batal</Button>
          <Button onClick={save} loading={saving}>Simpan</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-input border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <Input label="Nama" value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. PT Maju Jaya" required />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" />
        <Input label="Telepon" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
        <Textarea label="Alamat" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Alamat klien" />
      </div>
    </Drawer>
  );
}
