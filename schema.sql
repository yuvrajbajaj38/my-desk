-- My Desk: private per-user cloud storage
-- Run this entire script in Supabase Dashboard > SQL Editor > New query.

create table if not exists public.my_desk_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.my_desk_data enable row level security;

drop policy if exists "Users can read their own My Desk data" on public.my_desk_data;
create policy "Users can read their own My Desk data"
on public.my_desk_data for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own My Desk data" on public.my_desk_data;
create policy "Users can insert their own My Desk data"
on public.my_desk_data for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own My Desk data" on public.my_desk_data;
create policy "Users can update their own My Desk data"
on public.my_desk_data for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update on public.my_desk_data to authenticated;
