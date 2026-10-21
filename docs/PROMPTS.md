# PROMPTS.md — Prompt Kickoff per Fase (Bayaro di Antigravity)

Cara pakai: salin blok prompt untuk fase yang sedang kamu kerjakan, tempel ke
Agent Panel Antigravity. Kerjakan **satu fase per waktu**, dan selalu biarkan
agent menampilkan rencana lebih dulu sebelum menyetujuinya.

> Prasyarat: `AGENTS.md` ada di root project, serta `docs/design.md`,
> `docs/Bayaro-Brief.md`, dan file ini ada di folder `docs/`.
> Rekomendasi model: **Gemini 3.x Pro (High)** untuk Fase 1–2, boleh model cepat
> untuk perubahan kecil.

---

## FASE 1 — Proof of Concept (buktikan kualitas rendering)

```
Peran: Kamu senior full-stack engineer yang membangun "Bayaro".
Baca dulu @AGENTS.md, @docs/Bayaro-Brief.md, dan @docs/design.md menyeluruh —
ketiganya sumber kebenaran.

Tujuan tugas INI (hanya Fase 1 — Proof of Concept):
Buktikan kualitas rendering invoice sebelum membangun apa pun yang lain.

Lingkup:
1. Scaffold Next.js (App Router, TypeScript) + Tailwind.
2. Terapkan design tokens dari design.md §1 (warna, Plus Jakarta Sans + IBM Plex
   Mono, radius, shadow) sebagai konfigurasi global.
3. Buat SATU template invoice "Jasa" sebagai komponen HTML/CSS sesuai design.md
   (§5.6 preview & §5.8 halaman view).
4. Halaman editor sederhana: form statis (data usaha, klien, item, pajak, diskon,
   catatan) + LIVE PREVIEW di samping; subtotal/pajak/total otomatis; format Rp
   ribuan; tanggal default hari ini zona WIB.
5. Export: tombol "Export PDF" & "Export PNG" via Playwright dari template HTML
   yang SAMA. Output harus identik antara preview, PDF, dan PNG (font konsisten,
   page-break benar).
6. Halaman view publik read-only memakai template yang sama.

Aturan:
- Bahasa UI Indonesia, mata uang IDR.
- JANGAN bangun auth, database, dashboard, multi-workspace, atau Midtrans dulu.
- Jangan menambah fitur di luar daftar.

Langkah:
1. Tampilkan RENCANA + checklist artifact Fase 1. Berhenti, tunggu persetujuanku.
2. Setelah kusetujui, eksekusi langkah demi langkah, jalankan dev server, dan
   tunjukkan hasil render PDF/PNG untuk kureview.
```

---

## FASE 2 — MVP (produk yang bisa dijual)

```
Peran: Lanjutkan membangun "Bayaro". Baca ulang @AGENTS.md, @docs/Bayaro-Brief.md,
dan @docs/design.md. Fase 1 sudah selesai (template + render PDF/PNG/link).

Tujuan Fase 2 (MVP):
Jadikan Bayaro produk utuh: akun, simpan data, kelola invoice, dan monetisasi.

Lingkup:
1. Supabase Auth: email+password dan Google. Halaman Login (split-screen,
   design.md §5.1), Sign up (§5.2), Onboarding profil usaha (§5.3).
2. Skema database 6 tabel persis seperti Bayaro-Brief.md §9:
   users, workspaces, clients, invoices, invoice_items (dengan kolom category),
   subscriptions. Sertakan workspace_id di clients & invoices. Saat user daftar,
   otomatis buat 1 workspace default (UI switcher belum ditampilkan).
3. App shell: sidebar + topbar (design.md §4). Default landing = tab Invoice.
4. Tab Invoice (§5.5): daftar/tabel, cari, filter status/tanggal, sort,
   menu baris (Lihat/Edit/Export/Tandai Lunas/Hapus), + Invoice Baru, empty state.
5. Invoice Editor (§5.6): form + live preview, pilih/﹢klien, kategori per item,
   penomoran otomatis, simpan draft & simpan, export PDF/PNG/Salin link (§5.7).
6. Tab Klien (§5.9) dan Tab Template (§5.10) dengan 3–5 template.
7. Plan Free vs Pro + KUOTA: Free maks 10 invoice/hari per user, real-time,
   zona WIB, dicek di server. Paywall modal saat kuota habis (§3.9).
   Watermark halus di output Free.
8. Midtrans Snap (Sandbox) + webhook sesuai Bayaro-Brief.md §7:
   buat order → Snap token → popup → webhook (verifikasi signature, idempotent)
   → aktifkan Pro. Tab Pengaturan/Billing (§5.11) dengan tombol Upgrade.

Aturan:
- Belum bangun Dashboard dan UI multi-workspace (itu Fase 3 & 4), tapi SIAPKAN
  kolom datanya (workspace_id, category) dari sekarang.
- Semua tombol wajib berjalan sesuai checklist design.md §9.
- Rahasia (Supabase keys, Midtrans keys) via environment variables, jangan hardcode.

Langkah:
1. Tampilkan RENCANA bertahap + checklist artifact + daftar env var yang kubutuhkan.
   Berhenti, tunggu persetujuanku.
2. Kerjakan per sub-bagian, jalankan & tunjukkan hasilnya tiap sub-bagian selesai.
```

---

## FASE 3 — Dashboard & Chart Kategori

```
Peran: Lanjutkan "Bayaro". Baca ulang @AGENTS.md, @docs/Bayaro-Brief.md,
dan @docs/design.md. Fase 2 (MVP) sudah jalan.

Tujuan Fase 3:
Bangun halaman Dashboard sesuai design.md §5.4 (referensi gaya: Prodex).

Lingkup:
1. 4 stat card real-time: Total Invoice, Terkirim, Lunas, Nilai bulan ini.
   Klik "Lunas" → buka Invoice terfilter status Lunas.
2. Dropdown pemilih bulan yang memfilter semua widget.
3. Bar chart "Nilai Invoice" per bulan dengan toggle Bulanan/Kuartal/Tahun +
   tooltip nominal saat hover.
4. Donut "Rincian Kategori": SUM(invoice_items.subtotal) GROUP BY category,
   tampilkan persentase; hover segmen → kategori+%, legenda klik → sorot.
   Gunakan palet kategori di design.md §1.1.
5. Tombol 👁 sembunyikan/tampilkan nominal (privasi layar).
6. Widget Aktivitas terbaru & Klien teratas (klik → navigasi ke entitasnya).
7. Untuk user Free: tampilkan sisa kuota harian + tombol Upgrade.
8. Jadikan Dashboard sebagai landing default setelah login (gantikan Invoice).

Aturan:
- Label widget: "Nilai Invoice / Rincian Kategori", BUKAN "Pengeluaran".
- State loading pakai skeleton; empty state kalau belum ada data.

Langkah:
1. Tampilkan RENCANA + pilihan library chart (ringan, cocok React) untuk kusetujui.
2. Setelah disetujui, bangun dan tunjukkan dengan data contoh lalu data asli.
```

---

## FASE 4 — Skala (multi-workspace & fitur retensi)

```
Peran: Lanjutkan "Bayaro". Baca ulang @AGENTS.md, @docs/Bayaro-Brief.md,
dan @docs/design.md. Fase 3 sudah jalan.

Tujuan Fase 4:
Buka fitur skala tanpa membongkar arsitektur (kolom sudah disiapkan sejak MVP).

Lingkup:
1. UI multi-workspace: workspace switcher di sidebar (design.md §4.1) + layar
   kelola/buat workspace (nama, logo, alamat, rekening, penomoran sendiri).
   Batas plan: Free = 1 workspace, Pro = banyak. Kuota tetap dihitung per user.
2. Duplikat invoice (dari menu baris §5.5).
3. Kirim invoice via email (link view publik) ke klien.
4. Reminder jatuh tempo (email) + status "Jatuh tempo" otomatis.
5. Template premium tambahan (badge Pro, kunci untuk Free).

Aturan:
- Semua data lama harus tetap valid (migrasi aman, tanpa kehilangan invoice).
- Jangan aktifkan fitur di luar daftar ini. Multi-currency & export Word/xlsx
  TETAP ditunda kecuali aku memintanya eksplisit.

Langkah:
1. Tampilkan RENCANA + dampak migrasi data untuk kusetujui.
2. Kerjakan per fitur, uji regresi fitur lama tiap selesai satu fitur.
```

---

## Prompt bantu (kapan saja)

- **Koreksi menyimpang:** `Cek ulang @docs/design.md bagian <X>, samakan implementasinya.`
- **Review kualitas:** `Audit semua tombol di <halaman> terhadap checklist design.md §9. Laporkan yang belum punya aksi/state/umpan balik.`
- **Sinkron konteks:** `Baca ulang @AGENTS.md dan ringkas aturan tetap sebelum lanjut.`
