-- ============================================================================
-- Bayaro — Migrasi 0004: flag onboarded (arahkan user baru ke /onboarding)
-- Jalankan di Supabase -> SQL Editor -> Run. Aman dijalankan ulang.
-- ============================================================================

alter table public.users add column if not exists onboarded boolean not null default false;

-- User yang sudah ada dianggap sudah terdaftar -> langsung ke dashboard
update public.users set onboarded = true where onboarded = false;

-- Catatan: trigger handle_new_user menyisipkan user tanpa 'onboarded'
-- sehingga user BARU otomatis onboarded = false -> diarahkan ke /onboarding.
