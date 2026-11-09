create table if not exists public.eudr_parcels (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  points jsonb not null check (jsonb_typeof(points) = 'array'),
  location jsonb,
  accuracy_m integer,
  crop text not null,
  harvest_year integer,
  volume text,
  destination text,
  producer text,
  layer text check (layer in ('thermal', 'ice', 'magnetic', 'topo', 'radar'))
);

alter table public.eudr_parcels enable row level security;
grant select, insert, update, delete on public.eudr_parcels to authenticated;

drop policy if exists eudr_parcels_select_own on public.eudr_parcels;
create policy eudr_parcels_select_own on public.eudr_parcels for select to authenticated using (auth.uid() = user_id);
drop policy if exists eudr_parcels_insert_own on public.eudr_parcels;
create policy eudr_parcels_insert_own on public.eudr_parcels for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists eudr_parcels_update_own on public.eudr_parcels;
create policy eudr_parcels_update_own on public.eudr_parcels for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists eudr_parcels_delete_own on public.eudr_parcels;
create policy eudr_parcels_delete_own on public.eudr_parcels for delete to authenticated using (auth.uid() = user_id);

create index if not exists eudr_parcels_user_id_created_at_idx on public.eudr_parcels (user_id, created_at desc);
