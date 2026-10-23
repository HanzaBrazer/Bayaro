-- ============================================================================
-- Bayaro — Migrasi awal (Langkah 2): 6 tabel + RLS + trigger profil
-- Jalankan di Supabase -> SQL Editor -> New query -> Run.
-- Aman dijalankan ulang (idempotent sebisa mungkin).
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. users (profil terhubung ke auth.users) --------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

-- 2. workspaces (identitas usaha) ------------------------------------------
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  name text not null default 'Usaha Saya',
  logo_url text,
  address text,
  bank_account text,
  npwp text,
  invoice_prefix text not null default 'INV-',
  next_invoice_number integer not null default 1,
  default_template_id text not null default 'jasa',
  created_at timestamptz not null default now()
);

-- 3. clients ----------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

-- 4. invoices ---------------------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  number text not null,
  type text not null default 'jasa',
  template_id text not null default 'jasa',
  issue_date date not null default (now() at time zone 'Asia/Jakarta')::date,
  due_date date,
  subtotal numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','terkirim','lunas','jatuh_tempo')),
  notes text,
  public_token text unique default encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz not null default now(),
  unique (workspace_id, number)
);

-- 5. invoice_items (dengan category) ---------------------------------------
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null default '',
  quantity numeric(12,2) not null default 1,
  unit_price numeric(14,2) not null default 0,
  subtotal numeric(14,2) not null default 0,
  category text not null default 'lainnya' check (category in ('barang','jasa','transportasi','lainnya')),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- 6. subscriptions ----------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  status text not null default 'active' check (status in ('active','pending','inactive','expired')),
  current_period_end timestamptz,
  midtrans_order_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- indexes -------------------------------------------------------------------
create index if not exists idx_workspaces_owner on public.workspaces(owner_user_id);
create index if not exists idx_clients_workspace on public.clients(workspace_id);
create index if not exists idx_invoices_workspace on public.invoices(workspace_id);
create index if not exists idx_invoices_user on public.invoices(user_id);
create index if not exists idx_invoice_items_invoice on public.invoice_items(invoice_id);
create index if not exists idx_subscriptions_user on public.subscriptions(user_id);

-- trigger: buat profil (& nanti bisa diperluas) saat user baru daftar -------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security --------------------------------------------------------
alter table public.users enable row level security;
alter table public.workspaces enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users for select using (id = auth.uid());
drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users for update using (id = auth.uid());

drop policy if exists ws_owner on public.workspaces;
create policy ws_owner on public.workspaces for all
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists clients_owner on public.clients;
create policy clients_owner on public.clients for all
  using (workspace_id in (select id from public.workspaces where owner_user_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_user_id = auth.uid()));

drop policy if exists invoices_owner on public.invoices;
create policy invoices_owner on public.invoices for all
  using (workspace_id in (select id from public.workspaces where owner_user_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_user_id = auth.uid()));

drop policy if exists items_owner on public.invoice_items;
create policy items_owner on public.invoice_items for all
  using (invoice_id in (
    select id from public.invoices
    where workspace_id in (select id from public.workspaces where owner_user_id = auth.uid())
  ))
  with check (invoice_id in (
    select id from public.invoices
    where workspace_id in (select id from public.workspaces where owner_user_id = auth.uid())
  ));

drop policy if exists subs_self on public.subscriptions;
create policy subs_self on public.subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
