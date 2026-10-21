# AGENTS.md — Bayaro

Kamu mengembangkan **Bayaro**, platform invoice & kwitansi generator untuk
freelancer dan UMKM Indonesia.

## Dokumen otoritatif (WAJIB dibaca sebelum tugas apa pun)
- `docs/Bayaro-Brief.md` — brief produk: scope, fitur, plan, skema DB, roadmap.
- `docs/design.md` — spesifikasi desain: design system, setiap layar, perilaku tiap tombol.
- `docs/PROMPTS.md` — prompt kickoff per fase (dipakai manusia, bukan untuk dieksekusi sendiri).

## Aturan tetap
1. `docs/design.md` dan `docs/Bayaro-Brief.md` adalah SATU-SATUNYA sumber kebenaran.
   Jika idemu berkonflik dengan dokumen ini, **dokumen menang**.
2. **Jangan menambah fitur** yang tidak ada di brief. Kalau ragu, tanya dulu.
3. Ikuti **fase di roadmap** (Fase 1 → 2 → 3 → 4). Jangan loncat fase tanpa konfirmasi.
4. Sebelum menulis kode untuk tugas apa pun: tampilkan **rencana + checklist artifact**,
   lalu berhenti dan tunggu persetujuan manusia.
5. Setiap tombol/tool harus punya **aksi + state (hover/active/focus/disabled/loading)
   + umpan balik (toast/konfirmasi)** — lihat checklist di `design.md` bagian 9.

## Tech stack (kunci — jangan diganti tanpa izin)
- **Framework:** Next.js (App Router) + TypeScript.
- **Styling:** Tailwind CSS dengan design tokens dari `design.md`.
- **Database/Auth/Storage:** Supabase (PostgreSQL + Auth + Storage).
- **Render PDF/PNG:** Playwright (headless Chromium) dari SATU template HTML/CSS.
- **Pembayaran:** Midtrans Snap (Sandbox dulu) + webhook.
- **Bahasa UI:** Indonesia. **Mata uang:** IDR. **Timezone kuota:** Asia/Jakarta (WIB).

## Design tokens (ringkas — detail penuh di design.md §1)
- Warna: `ink #1C1A17`, `bone #F4EFE4`, `canvas #F7F6F3`, `surface #FFFFFF`,
  `line #E7E3DA`, `muted #6B655B`, `primary #2E7D5B`, `primary-hover #276A4D`.
- Font: **Plus Jakarta Sans** (UI) + **IBM Plex Mono** (nomor invoice & nominal).
- Radius: input/tombol 10px, kartu 16px, modal 20px, badge 999px.

## Aturan domain yang mudah salah
- **Kuota Free = 10 invoice/hari**, dihitung **per user** (bukan per workspace),
  **real-time** (COUNT, bukan simpan angka sisa), zona **WIB**, dicek di **server**.
- **Nomor invoice** unik & berurutan per workspace (prefix + urutan).
- **Pembayaran:** sumber kebenaran = **webhook Midtrans** (bukan frontend).
  Verifikasi signature, buat handler **idempotent**.
- `workspace_id` dan `invoice_items.category` **sudah ada sejak MVP** meski UI-nya
  menyusul — siapkan kolomnya, jangan tunda ke migrasi besar.
- Invoice = uang **masuk**. Label dashboard = "Nilai Invoice / Rincian Kategori",
  **bukan** "Pengeluaran".

## Definisi "selesai" untuk setiap fitur UI
- Punya state: default, loading, empty, error.
- Aksi destruktif (hapus) pakai modal konfirmasi; aksi sukses memunculkan toast.
- Responsif (desktop/tablet/mobile) & lolos quality floor aksesibilitas (design.md §8).
