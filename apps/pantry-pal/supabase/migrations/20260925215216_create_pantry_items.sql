-- pantry_items: one row per grocery item a user logs. Owner-only access via RLS.

create type public.pantry_item_status as enum ('in_pantry', 'used', 'discarded');

create table public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  expires_on date,
  status public.pantry_item_status not null default 'in_pantry',
  status_changed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.pantry_items is 'Groceries a user has logged; RLS limits every row to its owner.';

alter table public.pantry_items enable row level security;

create policy "pantry_items_select_own" on public.pantry_items
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "pantry_items_insert_own" on public.pantry_items
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "pantry_items_update_own" on public.pantry_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- No delete policy: items are marked used/discarded instead, which the brief's metrics need.

create index pantry_items_user_status_expiry_idx
  on public.pantry_items (user_id, status, expires_on);
