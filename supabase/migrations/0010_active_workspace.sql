-- ============================================================================
-- Bayaro — Migrasi 0010: workspace aktif (multi-workspace).
-- Jalankan di Supabase -> SQL Editor -> Run. Aman dijalankan ulang.
-- ============================================================================

-- Workspace yang sedang dibuka user. Tersimpan di DB (bukan cookie) supaya
-- pilihan terakhir terbawa ke perangkat lain.
--
-- Catatan keamanan: policy users_update_self mengizinkan user mengisi kolom ini
-- dengan uuid apa pun. Server SELALU memverifikasi kepemilikan saat membaca
-- (lib/workspace/active.ts); id milik orang lain diabaikan dan jatuh ke
-- workspace tertua milik user. RLS workspaces tetap menjadi pagar utama.
alter table public.users
  add column if not exists active_workspace_id uuid
  references public.workspaces(id) on delete set null;
