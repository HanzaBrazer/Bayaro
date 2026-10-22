# Panduan Membangun Bayaro dengan Claude Code (Awal → Akhir)

Panduan ini membawa kamu dari folder kosong sampai platform lengkap, memakai
**Claude Code**. Prinsipnya tetap: **satu langkah kecil per waktu, Plan Mode dulu,
review, eksekusi, test, commit, bersihkan konteks, lanjut.**

---

## 0. Persiapan sekali di awal

1. **Install Claude Code** (butuh Node.js LTS terbaru):
   ```
   npm install -g @anthropic-ai/claude-code
   ```
   Panduan resmi & persyaratan terbaru: https://docs.claude.com/en/docs/claude-code/overview

2. **Buat folder project & masukkan dokumen:**
   ```
   bayaro/
   ├─ CLAUDE.md            ← root (dibaca otomatis tiap sesi)
   └─ docs/
      ├─ Bayaro-Brief.md
      ├─ design.md
      └─ BUILD-SEQUENCE.md
   ```
   > `CLAUDE.md` menggantikan `AGENTS.md`. Karena dibaca otomatis, **tidak perlu**
   > di-@mention di prompt. Cukup rujuk `@docs/design.md` saat butuh detail.

3. **Inisialisasi git** (wajib — supaya bisa commit per langkah & mudah mundur):
   ```
   cd bayaro && git init
   ```

4. **Jalankan Claude Code** di folder itu:
   ```
   claude
   ```

5. **Pilih model:** gunakan alias **`opusplan`** — Opus untuk merencanakan, Sonnet
   untuk eksekusi. Pas untuk alur "rencana dulu, baru ngoding".
   ```
   /model opusplan
   ```

6. **Verifikasi memory terbaca:** ketik `/memory` untuk memastikan `CLAUDE.md` aktif.

---

## 1. Loop baku untuk SETIAP langkah (Langkah 0–12)

Ulangi siklus ini untuk tiap langkah di `docs/BUILD-SEQUENCE.md`:

1. **Masuk Plan Mode** — tekan **Shift+Tab** (atau ketik `/plan`). Di mode ini
   Claude hanya membaca & menyusun rencana, **tidak menyentuh file**.
2. **Tempel prompt langkah** dari `BUILD-SEQUENCE.md` (lihat §2 soal penyesuaian kecil).
3. **Baca rencananya.** Kalau ada yang meleset dari dokumen, koreksi:
   *"Cek ulang @docs/design.md bagian X, samakan rencananya."*
4. **Setujui** → keluar Plan Mode (Shift+Tab lagi atau `/exit-plan-mode`) dan minta
   eksekusi: *"Jalankan rencana ini."*
5. **Uji hasilnya** — jalankan `npm run dev`, cek halaman/tombol yang relevan.
6. **Perintahkan test bersih:** *"Jalankan lint dan typecheck, perbaiki errornya."*
7. **Commit:** *"Commit dengan pesan: feat(langkah-N): ..."*
   (atau `git commit` sendiri).
8. **Bersihkan konteks** untuk langkah berikutnya: ketik **`/clear`**.
   Ini menghapus riwayat sesi tetapi **CLAUDE.md tetap aktif** — menjaga konteks
   ramping dan akurat.

> Kenapa `/clear` tiap langkah: konteks yang menumpuk membuat agent melambat dan
> gampang "lupa" aturan. Memory `CLAUDE.md` yang permanen sudah cukup membawa aturan.

---

## 2. Cara memakai prompt dari BUILD-SEQUENCE.md

Prompt Langkah 0–12 di `docs/BUILD-SEQUENCE.md` bisa dipakai langsung, dengan
**dua penyesuaian kecil** untuk Claude Code:

- **Hapus baris `@AGENTS.md`** di tiap prompt — di Claude Code, `CLAUDE.md` sudah
  otomatis terbaca. Rujukan `@docs/design.md` dan `@docs/Bayaro-Brief.md` tetap dipakai.
- **Tidak perlu menulis "tampilkan rencana dulu"** — itu ditangani oleh **Plan Mode**
  (Shift+Tab). Boleh tetap ditulis, tidak masalah.

Selain itu, scope tiap langkah (apa yang dibangun + "Selesai bila…") sama persis.

---

## 3. Prompt pembuka — Langkah 0 (siap tempel)

Masuk Plan Mode (Shift+Tab) dulu, lalu tempel:

```
Peran: senior full-stack engineer membangun "Bayaro".
Baca menyeluruh CLAUDE.md, @docs/design.md, @docs/Bayaro-Brief.md.

Tujuan langkah ini: fondasi project + design system, BELUM fitur bisnis.
Lingkup:
1. Scaffold Next.js (App Router, TypeScript) + Tailwind. Siapkan Supabase client
   (env var, belum bikin tabel). Struktur folder rapi.
2. Terapkan design tokens dari design.md §1 di tailwind config; font Plus Jakarta
   Sans & IBM Plex Mono via next/font; radius, shadow, spacing.
3. Bangun komponen dasar design.md §3 LENGKAP dengan state (default/hover/active/
   focus/disabled/loading): Button, Input/Textarea/Select/DatePicker/Toggle/
   FileUpload, Card, StatCard, Table, Badge, Modal, Drawer, Toast, EmptyState,
   PaywallModal.
4. Halaman internal /dev/components yang menampilkan semua komponen & state.
5. Perbarui bagian "Perintah proyek" di CLAUDE.md dengan perintah dev/build/lint/
   typecheck yang sebenarnya setelah scaffold.

Aturan: Bahasa UI Indonesia, IDR. Belum ada auth/DB/halaman bisnis.
Setelah kusetujui rencananya, eksekusi, jalankan /dev/components, lalu lint + typecheck.

Selesai bila: /dev/components menampilkan semua komponen dengan semua state,
tokens warna/font persis design.md.
```

Setelah ini selesai (dan di-commit), lanjut **Langkah 1** dari `BUILD-SEQUENCE.md`
dengan loop di §1. Begitu seterusnya sampai **Langkah 12** (QA audit).

---

## 4. (Opsional) Custom slash command untuk audit berulang

Buat perintah `/audit` supaya gampang menjalankan pengecekan "semua tombol
berjalan" kapan pun. Buat file:

`.claude/commands/audit.md`
```markdown
Audit semua tombol & tool di halaman $ARGUMENTS terhadap checklist @docs/design.md §9.
Tampilkan tabel: elemen | punya aksi? | state lengkap? | umpan balik?
Lalu sebutkan yang perlu diperbaiki (tanpa mengubah kode sampai aku setujui).
```

Pakai dengan: `/audit halaman invoice` atau `/audit dashboard`.

Kamu bisa bikin command lain, mis. `.claude/commands/token-check.md` untuk
memverifikasi pemakaian design tokens.

---

## 5. Urutan lengkap (ringkasan)

| Langkah | Isi | Sumber scope |
|---|---|---|
| 0 | Fondasi + design system + /dev/components | §3 di atas |
| 1 | App shell & navigasi | BUILD-SEQUENCE Langkah 1 |
| 2 | Database (6 tabel + RLS) & Auth (Login/SignUp) | Langkah 2 |
| 3 | Onboarding workspace | Langkah 3 |
| 4 | Invoice Editor + live preview (inti) | Langkah 4 |
| 5 | Export PDF/PNG + halaman view publik | Langkah 5 |
| 6 | Daftar invoice | Langkah 6 |
| 7 | Klien (+ sambung editor) | Langkah 7 |
| 8 | Template | Langkah 8 |
| 9 | Plan, kuota harian & paywall | Langkah 9 |
| 10 | Billing & Midtrans webhook | Langkah 10 |
| 11 | Dashboard | Langkah 11 |
| 12 | QA audit "semua tombol berjalan" | Langkah 12 |

---

## 6. Tips khusus Claude Code

- **Plan Mode adalah temanmu.** Untuk langkah berisiko (render PDF di Langkah 5,
  webhook Midtrans di Langkah 10), tambahkan kata **"think hard"** di prompt agar
  Claude berpikir lebih dalam saat menyusun rencana.
- **Permission-based.** Claude Code minta izin sebelum mengubah file / menjalankan
  perintah. Review tiap izin. Untuk pekerjaan boilerplate yang aman, kamu bisa pakai
  mode Accept Edits (Shift+Tab siklus) — tapi hati-hati untuk langkah yang menyentuh
  DB/pembayaran.
- **Commit tiap langkah.** Kalau hasil langkah berikutnya meleset, gampang `git revert`.
- **`/clear` antar langkah**, jangan antar sub-tugas di langkah yang sama.
- **Perbarui `CLAUDE.md` saat ada keputusan baru** — tekan `#` lalu tulis instruksinya,
  Claude Code akan memasukkannya ke memory. Contoh: setelah memilih library chart.
- **Jangan satukan beberapa langkah** jadi satu prompt — itu sumber utama hasil tidak akurat.
- Kalau Claude mulai menyimpang: `/memory` untuk cek aturan, atau rujuk ulang
  `@docs/design.md` bagian terkait.

Dengan pola ini, saat Langkah 12 selesai kamu punya Bayaro yang utuh dan konsisten
dengan brief — dibangun langkah demi langkah yang bisa kamu review sepanjang jalan.
