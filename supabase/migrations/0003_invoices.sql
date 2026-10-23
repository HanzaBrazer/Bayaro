-- ============================================================================
-- Bayaro — Migrasi 0003 (Langkah 4): snapshot klien + nomor invoice atomik
-- Jalankan di Supabase -> SQL Editor -> Run. Aman dijalankan ulang.
-- ============================================================================

-- Snapshot klien pada invoice (Langkah 7 akan mengisi dari daftar klien tersimpan)
alter table public.invoices add column if not exists client_name text;
alter table public.invoices add column if not exists client_address text;

-- Alokasi nomor invoice berurutan & unik per workspace (atomik, anti-duplikat)
create or replace function public.allocate_invoice_number(p_workspace uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_num integer;
begin
  select invoice_prefix, next_invoice_number
    into v_prefix, v_num
  from public.workspaces
  where id = p_workspace and owner_user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Workspace tidak ditemukan atau bukan milik Anda';
  end if;

  update public.workspaces
    set next_invoice_number = v_num + 1
  where id = p_workspace;

  return v_prefix || lpad(v_num::text, 4, '0');
end;
$$;

grant execute on function public.allocate_invoice_number(uuid) to authenticated;
