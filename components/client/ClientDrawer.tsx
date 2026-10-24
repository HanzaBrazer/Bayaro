"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Drawer, Input, Textarea, Button, Checkbox, useToast } from "@/components/ui";
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
  offerSaveToList = false,
}: {
  open: boolean;
  onClose: () => void;
  initial?: ClientRecord | null;
  /** persisted=false berarti klien dipakai sekali untuk invoice ini (tak disimpan ke daftar). */
  onSaved?: (client: ClientRecord, persisted: boolean) => void;
  /** Tampilkan opsi "Simpan ke daftar klien" (dipakai dari editor invoice). */
  offerSaveToList?: boolean;
}) {
  const toast = useToast();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [saveToList, setSaveToList] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Opsi "simpan ke daftar" hanya relevan saat membuat klien baru dari editor.
  const showSaveOption = offerSaveToList && !initial;

  // Sinkronkan saat drawer dibuka / target edit berubah.
  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setEmail(initial?.email ?? "");
      setPhone(initial?.phone ?? "");
      setAddress(initial?.address ?? "");
      setSaveToList(true);
      setError(null);
    }
  }, [open, initial]);

  async function save() {
    if (!name.trim()) return setError("Nama klien wajib diisi.");
    setError(null);

    // Mode sekali pakai: tidak menyimpan ke daftar klien, hanya dipakai di invoice ini.
    if (showSaveOption && !saveToList) {
      onSaved?.(
        { id: "", name: name.trim(), email: email.trim() || null, phone: phone.trim() || null, address: address.trim() || null },
        false
      );
      toast.success("Klien dipakai untuk invoice ini");
      onClose();
      return;
    }

    setSaving(true);
    const input = { name, email, phone, address };
    if (initial) {
      const res = await updateClientRecord(initial.id, input);
      setSaving(false);
      if (res.error) return setError(res.error);
      toast.success("Klien diperbarui");
      onSaved?.(
        { id: initial.id, name: name.trim(), email: email.trim() || null, phone: phone.trim() || null, address: address.trim() || null },
        true
      );
      onClose();
    } else {
      const res = await createClientRecord(input);
      setSaving(false);
      if (res.error || !res.client) return setError(res.error ?? "Gagal menyimpan klien.");
      toast.success("Klien tersimpan");
      onSaved?.(res.client, true);
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
        <Input label="Nama" value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. John Doe" required />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" />
        <Input label="Telepon" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
        <Textarea label="Alamat" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Alamat klien" />

        {showSaveOption && (
          <Checkbox
            checked={saveToList}
            onChange={(e) => setSaveToList(e.target.checked)}
            label={
              <span>
                Simpan ke daftar klien
                <span className="mt-0.5 block text-xs text-muted">
                  Agar bisa dipakai lagi di invoice berikutnya. Jika tidak dicentang, klien hanya dipakai untuk invoice ini.
                </span>
              </span>
            }
          />
        )}
      </div>
    </Drawer>
  );
}
