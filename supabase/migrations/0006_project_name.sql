-- ============================================================================
-- Bayaro — Migrasi 0006: nama proyek pada invoice.
-- Tampil di blok "Nama Proyek" template Jasa.
-- Jalankan di Supabase -> SQL Editor -> Run. Aman dijalankan ulang.
-- ============================================================================

alter table public.invoices add column if not exists project_name text;
