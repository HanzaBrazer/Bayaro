"use client";

import * as React from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Copy, Trash2, Check } from "lucide-react";
import { Toggle } from "@/components/ui";
import { cn } from "@/lib/utils";
import { BLOCK_LABEL, MAX_TEXT, type Block, type BlockType, type LayoutSettings } from "@/lib/custom-template/schema";
import { SWATCHES, contrastWithWhite, passesAA } from "@/lib/custom-template/contrast";
import type { LayoutEditor } from "./useLayoutEditor";

/* ------------------------------ kontrol kecil ------------------------------ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5 border-b border-line px-4 py-4 last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</p>
      {children}
    </div>
  );
}

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="block text-[13px] font-medium text-ink">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-btn border border-line bg-canvas p-0.5">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-8 flex-1 rounded-[8px] px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              value === o.value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Textarea dengan state lokal: perubahan di-commit setelah jeda mengetik atau
 * saat fokus keluar — supaya "Urungkan" tidak membatalkan satu huruf per klik.
 */
function DebouncedText({
  value,
  onCommit,
  label,
  placeholder,
}: {
  value: string;
  onCommit: (v: string) => void;
  label: string;
  placeholder: string;
}) {
  const [draft, setDraft] = React.useState(value);
  const committed = React.useRef(value);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ikuti perubahan dari luar (mis. Urungkan) selama pengguna tidak sedang mengetik.
  React.useEffect(() => {
    if (!timer.current) {
      setDraft(value);
      committed.current = value;
    }
  }, [value]);

  const flush = (v: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (v !== committed.current) {
      committed.current = v;
      onCommit(v);
    }
  };

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <>
      <textarea
        value={draft}
        onChange={(e) => {
          const v = e.target.value.slice(0, MAX_TEXT);
          setDraft(v);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => flush(v), 600);
        }}
        onBlur={() => flush(draft)}
        rows={4}
        maxLength={MAX_TEXT}
        aria-label={label}
        placeholder={placeholder}
        className="w-full resize-y rounded-input border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <p className={cn("text-right text-xs", draft.length >= MAX_TEXT ? "text-danger" : "text-muted")}>
        {draft.length}/{MAX_TEXT}
      </p>
    </>
  );
}

/* --------------------------- konfigurasi per blok --------------------------- */

const FIELD_OPTIONS: Partial<Record<BlockType, { key: string; label: string }[]>> = {
  info_usaha: [
    { key: "address", label: "Alamat" },
    { key: "phone", label: "Telepon" },
    { key: "email", label: "Email" },
    { key: "website", label: "Website" },
  ],
  info_klien: [
    { key: "address", label: "Alamat" },
    { key: "phone", label: "Telepon" },
    { key: "email", label: "Email" },
  ],
  detail_invoice: [
    { key: "number", label: "Nomor invoice" },
    { key: "issueDate", label: "Tanggal terbit" },
    { key: "dueDate", label: "Jatuh tempo" },
  ],
  info_pembayaran: [
    { key: "bank", label: "Nama bank" },
    { key: "accountNumber", label: "No. rekening" },
    { key: "accountHolder", label: "Atas nama" },
  ],
  ringkasan_total: [
    { key: "subtotal", label: "Subtotal" },
    { key: "discount", label: "Diskon" },
    { key: "tax", label: "Pajak" },
  ],
  footer: [
    { key: "phone", label: "Telepon" },
    { key: "email", label: "Email" },
    { key: "website", label: "Website" },
  ],
};

const COLUMN_OPTIONS = [
  { key: "no", label: "No." },
  { key: "category", label: "Kategori" },
  { key: "qty", label: "Qty" },
  { key: "price", label: "Harga" },
  { key: "amount", label: "Jumlah" },
] as const;

const HAS_TITLE: BlockType[] = ["info_usaha", "info_klien", "nama_proyek", "info_pembayaran", "catatan", "syarat_ketentuan"];
const NO_STYLE: BlockType[] = ["pemisah", "spasi"];
const HAS_SIZE: BlockType[] = ["logo", "spasi"];
const HAS_TEXT: BlockType[] = ["teks_bebas", "footer"];

/** Kontrol warna aksen: swatch berlabel + input hex + peringatan kontras. */
function AccentPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value]);
  const valid = /^#[0-9a-fA-F]{6}$/.test(draft);
  const ok = passesAA(value);

  return (
    <div className="space-y-2">
      <span className="block text-[13px] font-medium text-ink">Warna aksen</span>
      <div className="grid grid-cols-4 gap-2">
        {SWATCHES.map((s) => {
          const active = s.hex.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={s.hex}
              type="button"
              onClick={() => onChange(s.hex)}
              title={s.label}
              aria-label={`${s.label}${active ? " (dipilih)" : ""}`}
              aria-pressed={active}
              className={cn(
                "flex h-9 items-center justify-center rounded-btn border transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                active ? "border-ink" : "border-transparent hover:scale-105"
              )}
              style={{ background: s.hex }}
            >
              {active && <Check className="h-4 w-4" style={{ color: passesAA(s.hex) ? "#FFFFFF" : "#1C1A17" }} />}
            </button>
          );
        })}
      </div>
      <label className="flex items-center gap-2">
        <span className="h-8 w-8 shrink-0 rounded-btn border border-line" style={{ background: valid ? draft : "transparent" }} aria-hidden />
        <input
          value={draft}
          onChange={(e) => {
            const v = e.target.value.trim();
            setDraft(v);
            if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v.toUpperCase());
          }}
          maxLength={7}
          aria-label="Kode warna hex"
          aria-invalid={!valid}
          className={cn(
            "h-8 w-full rounded-input border bg-surface px-2.5 font-mono text-xs uppercase text-ink focus-visible:outline-none focus-visible:ring-2",
            valid ? "border-line focus-visible:ring-primary" : "border-danger focus-visible:ring-danger"
          )}
        />
      </label>
      {!valid && <p className="text-xs text-danger">Gunakan format #RRGGBB, mis. #2E7D5B.</p>}
      {valid && !ok && (
        <p className="flex items-start gap-1.5 rounded-btn bg-warning-soft px-2 py-1.5 text-xs text-warning">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Kontras {contrastWithWhite(value).toFixed(1)}:1 — teks putih di kepala tabel & bar total sulit dibaca
          (minimal 4.5:1). Pilih warna yang lebih gelap.
        </p>
      )}
    </div>
  );
}

function GlobalSettings({ settings, editor }: { settings: LayoutSettings; editor: LayoutEditor }) {
  return (
    <>
      <Section title="Tampilan">
        <AccentPicker value={settings.accentColor} onChange={(accentColor) => editor.updateSettings({ accentColor })} />
      </Section>
      <Section title="Teks & halaman">
        <Segmented
          label="Judul dokumen"
          value={settings.titleLabel}
          options={[
            { value: "INVOICE", label: "Invoice" },
            { value: "FAKTUR", label: "Faktur" },
            { value: "TAGIHAN", label: "Tagihan" },
          ]}
          onChange={(titleLabel) => editor.updateSettings({ titleLabel })}
        />
        <Segmented
          label="Ukuran teks"
          value={settings.baseFontSize}
          options={[
            { value: 12, label: "Kecil" },
            { value: 13, label: "Sedang" },
            { value: 14, label: "Besar" },
          ]}
          onChange={(baseFontSize) => editor.updateSettings({ baseFontSize })}
        />
        <Segmented
          label="Margin halaman"
          value={settings.pageMargin}
          options={[
            { value: "S", label: "Rapat" },
            { value: "M", label: "Sedang" },
            { value: "L", label: "Lega" },
          ]}
          onChange={(pageMargin) => editor.updateSettings({ pageMargin })}
        />
        <Segmented
          label="Tampilan angka"
          value={settings.numberStyle}
          options={[
            { value: "mono", label: "Monospace" },
            { value: "biasa", label: "Biasa" },
          ]}
          onChange={(numberStyle) => editor.updateSettings({ numberStyle })}
        />
      </Section>
    </>
  );
}

function BlockSettings({ block, editor, onDeselect }: { block: Block; editor: LayoutEditor; onDeselect: () => void }) {
  const p = block.props ?? {};
  const t = block.type;
  const set = (patch: Block["props"]) => editor.updateBlockProps(block.id, patch);
  const fieldOpts = FIELD_OPTIONS[t];
  const text = p.text ?? "";

  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <p className="text-sm font-semibold text-ink">{BLOCK_LABEL[t]}</p>
        <button type="button" onClick={onDeselect} className="text-xs font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:underline">
          Pengaturan global
        </button>
      </div>

      <Section title="Aksi">
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "Naik", icon: <ArrowUp className="h-4 w-4" />, run: () => editor.moveBlockStep(block.id, -1) },
            { label: "Turun", icon: <ArrowDown className="h-4 w-4" />, run: () => editor.moveBlockStep(block.id, 1) },
            { label: "Duplikat", icon: <Copy className="h-4 w-4" />, run: () => editor.duplicateBlock(block.id) },
            {
              label: "Hapus",
              icon: <Trash2 className="h-4 w-4" />,
              run: () => {
                editor.removeBlock(block.id);
                onDeselect();
              },
              danger: true,
            },
          ].map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.run}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-1 rounded-btn border border-line text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                a.danger ? "text-danger hover:bg-danger-soft" : "text-ink hover:bg-canvas"
              )}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      </Section>

      {!NO_STYLE.includes(t) && (
        <Section title="Gaya">
          <Segmented
            label="Perataan"
            value={p.align ?? "left"}
            options={[
              { value: "left", label: "Kiri" },
              { value: "center", label: "Tengah" },
              { value: "right", label: "Kanan" },
            ]}
            onChange={(align) => set({ align })}
          />
          <Segmented
            label="Latar"
            value={p.background ?? "none"}
            options={[
              { value: "none", label: "Polos" },
              { value: "muted", label: "Abu" },
              { value: "accent", label: "Aksen" },
            ]}
            onChange={(background) => set({ background })}
          />
          {HAS_TITLE.includes(t) && (
            <Toggle label="Tampilkan judul blok" checked={p.showTitle !== false} onChange={(showTitle) => set({ showTitle })} />
          )}
        </Section>
      )}

      {HAS_SIZE.includes(t) && (
        <Section title="Ukuran">
          <Segmented
            label={t === "logo" ? "Ukuran logo" : "Tinggi spasi"}
            value={p.size ?? "M"}
            options={[
              { value: "S", label: "Kecil" },
              { value: "M", label: "Sedang" },
              { value: "L", label: "Besar" },
            ]}
            onChange={(size) => set({ size })}
          />
        </Section>
      )}

      {fieldOpts && (
        <Section title="Yang ditampilkan">
          {fieldOpts.map((o) => (
            <Toggle
              key={o.key}
              label={o.label}
              checked={(p.fields as Record<string, boolean> | undefined)?.[o.key] !== false}
              onChange={(v) => set({ fields: { [o.key]: v } })}
            />
          ))}
        </Section>
      )}

      {t === "tabel_item" && (
        <Section title="Kolom tabel">
          <p className="text-xs text-muted">Kolom &ldquo;Deskripsi&rdquo; selalu tampil.</p>
          {COLUMN_OPTIONS.map((o) => (
            <Toggle
              key={o.key}
              label={o.label}
              checked={p.columns?.[o.key] !== false}
              onChange={(v) => set({ columns: { [o.key]: v } })}
            />
          ))}
        </Section>
      )}

      {HAS_TEXT.includes(t) && (
        <Section title={t === "footer" ? "Teks tambahan" : "Isi teks"}>
          <DebouncedText
            key={block.id}
            value={text}
            onCommit={(v) => set({ text: v })}
            label={t === "footer" ? "Teks tambahan footer" : "Isi teks bebas"}
            placeholder={t === "footer" ? "mis. Terima kasih atas kerja samanya" : "Tulis teks di sini"}
          />
        </Section>
      )}
    </>
  );
}

export function BlockInspector({
  block,
  settings,
  editor,
  onDeselect,
}: {
  block: Block | null;
  settings: LayoutSettings;
  editor: LayoutEditor;
  onDeselect: () => void;
}) {
  return block ? (
    <BlockSettings block={block} editor={editor} onDeselect={onDeselect} />
  ) : (
    <GlobalSettings settings={settings} editor={editor} />
  );
}
