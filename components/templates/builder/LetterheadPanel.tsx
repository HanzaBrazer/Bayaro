"use client";

import * as React from "react";
import { FileUp, Loader2, Trash2 } from "lucide-react";
import { Button, Modal, useToast } from "@/components/ui";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { removeLetterhead, setLetterheadUrl, uploadLetterhead } from "@/lib/custom-template/actions";
import { LETTERHEAD_ACCEPT, prepareLetterhead } from "@/lib/custom-template/letterhead";
import { LETTERHEAD_BUCKET } from "@/lib/custom-template/types";
import type { Letterhead } from "@/lib/custom-template/types";

const MAX_OFFSET = 600;

function Slider({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  // Panel ini dirender dua kali (desktop & HP), jadi id-nya harus unik.
  const id = React.useId();
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <label className="text-[13px] font-medium text-ink" htmlFor={id}>
          {label}
        </label>
        <span className="font-mono text-xs text-muted">{value}px</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={MAX_OFFSET}
        step={4}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-6 w-full accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <p className="text-[11px] text-muted">{hint}</p>
    </div>
  );
}

export function LetterheadPanel({
  templateId,
  letterhead,
  onChange,
}: {
  templateId: string;
  letterhead: Letterhead | null;
  onChange: (next: Letterhead | null) => void;
}) {
  const toast = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // supaya berkas yang sama bisa dipilih lagi setelah gagal
    if (!file || busy) return;

    setBusy(true);
    try {
      const prepared = await prepareLetterhead(file);
      if (prepared.error !== null) return toast.error("Kop surat ditolak", prepared.error);

      const { blob, ext, contentType } = prepared.file;
      const path = `${templateId}-${Date.now()}.${ext}`;
      const sb = createBrowserSupabase();
      const { error: upErr } = await sb.storage
        .from(LETTERHEAD_BUCKET)
        .upload(path, blob, { upsert: true, contentType });

      let url: string;
      if (upErr) {
        // Cadangan lewat server (service role) bila policy storage menolak.
        const fd = new FormData();
        fd.append("templateId", templateId);
        fd.append("file", new File([blob], `kop.${ext}`, { type: contentType }));
        const res = await uploadLetterhead(fd);
        if (res.error || !res.url) return toast.error("Gagal mengunggah", res.error ?? upErr.message);
        url = res.url;
      } else {
        url = sb.storage.from(LETTERHEAD_BUCKET).getPublicUrl(path).data.publicUrl;
        const saved = await setLetterheadUrl(templateId, url);
        if (saved.error) return toast.error("Gagal menyimpan", saved.error);
      }

      onChange({ url, top: letterhead?.top ?? 160, bottom: letterhead?.bottom ?? 90 });
      toast.success("Kop surat terpasang", "Atur area aman agar isi invoice tidak menimpa kop.");
    } catch {
      toast.error("Gagal mengunggah", "Jaringan bermasalah. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await removeLetterhead(templateId);
      if (res.error) return toast.error("Gagal melepas", res.error);
      onChange(null);
      setConfirmOpen(false);
      toast.success("Kop surat dilepas");
    } catch {
      toast.error("Gagal melepas", "Jaringan bermasalah. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2.5 border-b border-line px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Kop surat</p>

      <input
        ref={inputRef}
        type="file"
        accept={LETTERHEAD_ACCEPT}
        onChange={pick}
        className="sr-only"
        aria-label="Pilih berkas kop surat"
      />

      {letterhead ? (
        <>
          <div className="overflow-hidden rounded-btn border border-line bg-canvas">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={letterhead.url} alt="Pratinjau kop surat" className="h-24 w-full object-cover object-top" />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} loading={busy}>
              Ganti
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="text-danger hover:bg-danger-soft"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => setConfirmOpen(true)}
              disabled={busy}
            >
              Lepas
            </Button>
          </div>
          <Slider
            label="Area aman atas"
            value={letterhead.top}
            onChange={(top) => onChange({ ...letterhead, top })}
            hint="Isi invoice mulai di bawah garis ini."
          />
          <Slider
            label="Area aman bawah"
            value={letterhead.bottom}
            onChange={(bottom) => onChange({ ...letterhead, bottom })}
            hint="Ruang yang dikosongkan untuk kaki kop surat."
          />
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex min-h-[88px] w-full flex-col items-center justify-center gap-1 rounded-btn border border-dashed border-line text-sm text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileUp className="h-5 w-5" />}
            <span>{busy ? "Memproses berkas…" : "Unggah kop surat"}</span>
          </button>
          <p className="text-[11px] text-muted">
            PDF, PNG, atau JPG · maksimal 5 MB. Halaman pertama PDF dipakai sebagai gambar kop.
          </p>
        </>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        size="sm"
        title="Lepas kop surat?"
        description="Template kembali tanpa kop surat, dan area aman diatur ulang ke 0."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Batal
            </Button>
            <Button className="bg-danger hover:bg-danger/90" onClick={remove} loading={busy}>
              Lepas
            </Button>
          </>
        }
      />
    </div>
  );
}
