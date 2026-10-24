# CLAUDE.md — Bayaro

> File ini dibaca Claude Code **otomatis setiap sesi**. Letakkan di **root project**
> dan commit ke git. Tidak perlu di-@mention.

Kamu mengembangkan **Bayaro**, platform invoice & kwitansi generator untuk
freelancer dan UMKM Indonesia.

## Dokumen otoritatif (baca sebelum tugas apa pun)
- `docs/Bayaro-Brief.md` — brief produk: scope, fitur, plan, skema DB, roadmap.
- `docs/design.md` — spesifikasi desain: design system, tiap layar, perilaku tiap tombol.
- `docs/BUILD-SEQUENCE.md` — urutan build page-demi-page (Langkah 0–12) yang dijalankan manusia.

Rujuk file ini dengan `@docs/design.md` saat butuh detail bagian tertentu.

## Aturan tetap
1. `docs/design.md` dan `docs/Bayaro-Brief.md` adalah **satu-satunya sumber kebenaran**.
   Jika idemu berkonflik dengan dokumen, **dokumen menang**.
2. **Jangan menambah fitur** di luar brief. Kalau ragu, tanya dulu.
3. Ikuti **fase di roadmap / urutan di BUILD-SEQUENCE.md**. Jangan loncat langkah tanpa izin.
4. Untuk setiap langkah: masuk **Plan Mode** lebih dulu, tampilkan rencana + checklist,
   tunggu persetujuan manusia sebelum menulis kode.
5. Setiap tombol/tool wajib punya **aksi + state (hover/active/focus/disabled/loading)
   + umpan balik (toast/konfirmasi)** — lihat checklist `design.md` §9.
6. Setelah menyelesaikan satu langkah, **jalankan lint + typecheck**, lalu **commit**
   dengan pesan yang jelas sebelum lanjut.

## Tech stack (jangan diganti tanpa izin)
- **Framework:** Next.js (App Router) + TypeScript.
- **Styling:** Tailwind CSS dengan design tokens dari `design.md`.
- **Database/Auth/Storage:** Supabase (PostgreSQL + Auth + Storage).
- **Render PDF/PNG:** di sisi browser (html2canvas + jsPDF) dari template HTML/CSS
  yang sama — unduhan langsung tersimpan ke perangkat & kompatibel dengan Vercel.
  (Sebelumnya Playwright server; diganti atas persetujuan karena Chromium serverless
  gagal/limit di Vercel.)
- **Pembayaran:** Midtrans Snap (Sandbox dulu) + webhook.
- **Bahasa UI:** Indonesia. **Mata uang:** IDR. **Timezone kuota:** Asia/Jakarta (WIB).

## Perintah proyek
- Dev server: `npm run dev` → http://localhost:3000
- Build: `npm run build`
- Start (hasil build): `npm run start`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck` (alias `tsc --noEmit`)
- (Jalankan `npm run lint` + `npm run typecheck` sebelum tiap commit.)

## Design tokens (ringkas — detail penuh di design.md §1)
- Warna: `ink #1C1A17`, `bone #F4EFE4`, `canvas #F7F6F3`, `surface #FFFFFF`,
  `line #E7E3DA`, `muted #6B655B`, `primary #2E7D5B`, `primary-hover #276A4D`.
- Font: **Plus Jakarta Sans** (UI) + **IBM Plex Mono** (nomor invoice & nominal).
- Radius: input/tombol 10px, kartu 16px, modal 20px, badge 999px.

## Aturan domain yang mudah salah
- **Kuota Free = 10 invoice/hari**, dihitung **per user** (bukan per workspace),
  **real-time** (COUNT, bukan simpan angka sisa), zona **WIB**, **diverifikasi di server**.
- **Nomor invoice** unik & berurutan per workspace (prefix + urutan).
- **Pembayaran:** sumber kebenaran = **webhook Midtrans** (bukan frontend).
  Verifikasi signature, buat handler **idempotent**.
- `workspace_id` dan `invoice_items.category` **sudah ada sejak MVP** meski UI-nya
  menyusul — siapkan kolomnya, jangan tunda ke migrasi besar.
- Invoice = uang **masuk**. Label dashboard = "Nilai Invoice / Rincian Kategori",
  **bukan** "Pengeluaran".
- **Rahasia** (Supabase & Midtrans keys) via environment variables — **jangan hardcode**,
  jangan commit `.env`.

## Definisi "selesai" untuk tiap fitur UI
- Punya state: default, loading (skeleton/spinner), empty, error.
- Aksi destruktif (hapus) pakai modal konfirmasi; aksi sukses memunculkan toast.
- Responsif (desktop/tablet/mobile) & lolos quality floor aksesibilitas (design.md §8).
- Lint & typecheck bersih.
