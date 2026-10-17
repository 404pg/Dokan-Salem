-- FCM device registry: one row per (user, token). Clients upsert their token;
-- the send-push Edge Function reads it (service role) to deliver pushes.
-- Owner runs this manually in the Supabase SQL Editor.

create table if not exists public.customer_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fcm_token text not null,
  platform text not null check (platform in ('android', 'ios')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, fcm_token)
);

create index if not exists customer_devices_user_idx
  on public.customer_devices(user_id);

alter table public.customer_devices enable row level security;

drop policy if exists customer_devices_owner_all on public.customer_devices;
create policy customer_devices_owner_all on public.customer_devices
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.customer_devices from anon;
grant select, insert, update, delete on public.customer_devices to authenticated;
