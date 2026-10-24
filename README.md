# Bayaro

Generator **invoice & kwitansi** untuk freelancer dan UMKM Indonesia.
Isi form → dokumen rapi → tersimpan terpusat → dibagikan lewat link.

> Dokumen otoritatif ada di `docs/`: `Bayaro-Brief.md` (produk), `design.md`
> (desain), `BUILD-SEQUENCE.md` (urutan build). Aturan kerja ada di `CLAUDE.md`.

## Tech stack

- **Next.js 15** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS 3** dengan design tokens dari `docs/design.md` (`tailwind.config.ts`)
- **Supabase** (PostgreSQL + Auth + Storage) — `@supabase/ssr`
- **Playwright** (headless Chromium) untuk render PDF/PNG dari satu template HTML/CSS
- **Midtrans Snap** (Sandbox) + webhook untuk pembayaran
- Font: **Plus Jakarta Sans** (UI) + **IBM Plex Mono** (nomor & nominal)

Bahasa UI: **Indonesia** · Mata uang: **IDR** · Timezone kuota: **Asia/Jakarta (WIB)**

## Prasyarat

- Node.js 18.18+ (disarankan 20 LTS) & npm

## Instalasi

```bash
# Pasang dependensi
npm install
```

> Unduh PDF/PNG dirender di sisi browser (html2canvas + jsPDF) — tidak perlu
> Chromium/Playwright.

## Konfigurasi environment

1. Salin template menjadi file lokal:

   ```bash
   cp .env.example .env.local
   ```

   > `.env.local` **tidak** di-commit (sudah di `.gitignore`). Rahasia hanya di sini.

2. Isi nilainya di `.env.local` (lihat komentar panduan di dalam `.env.example`):

   | Variabel | Dari mana | Rahasia? |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | tidak |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API → `anon` `public` | tidak |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → `service_role` `secret` | **ya (server-only)** |
   | `MIDTRANS_SERVER_KEY` | Midtrans (Sandbox) → Settings → Access Keys → Server Key | **ya (server-only)** |
   | `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Midtrans (Sandbox) → Access Keys → Client Key | tidak |
   | `MIDTRANS_IS_PRODUCTION` | `false` saat Sandbox | — |
   | `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` saat dev | — |
   | `APP_TIMEZONE` | `Asia/Jakarta` | — |

   Untuk tahap fondasi, placeholder sudah cukup — app tetap jalan. Nilai Supabase
   dipakai mulai langkah Database & Auth; Midtrans mulai langkah Pembayaran.

## Menjalankan

```bash
npm run dev
```

Buka:

- <http://localhost:3000> — landing ber-brand Bayaro
- <http://localhost:3000/health> — status environment & koneksi Supabase (anti-crash walau env kosong)

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Dev server di `http://localhost:3000` |
| `npm run build` | Build produksi |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | ESLint (`eslint-config-next`) |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |

Jalankan **lint + typecheck** sebelum tiap commit.

## Catatan: Webhook Midtrans (nanti, saat langkah Pembayaran)

Midtrans mengirim notifikasi pembayaran ke **Notification URL** publik. Di dev lokal,
`localhost` tidak bisa diakses Midtrans, jadi perlu **tunnel** yang mengekspos
`http://localhost:3000` ke URL publik, misalnya:

```bash
# salah satu
ngrok http 3000
# atau
cloudflared tunnel --url http://localhost:3000
```

Lalu set **Notification URL** di dashboard Midtrans ke
`https://<url-tunnel>/api/midtrans/webhook`. Webhook **wajib** verifikasi signature
dan **idempotent**. Detail lengkap dikerjakan pada langkah Billing & Pembayaran
(lihat `docs/BUILD-SEQUENCE.md` Langkah 10).

## Struktur folder

```
app/            # routes (App Router): / , /health , api/
components/     # komponen UI (brand/, ui/)
lib/            # supabase/ (client & server), utils.ts
docs/           # dokumen otoritatif produk & desain
```
