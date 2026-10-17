-- Customer soft delete: archive customers by hiding them from the admin list
-- while keeping the profiles row, orders and history intact. Owner runs this.

alter table public.profiles
  add column if not exists archived_at timestamptz;

create index if not exists profiles_archived_at_idx
  on public.profiles (archived_at)
  where archived_at is null;

create or replace function public.admin_customer_overview()
returns table (
  id uuid,
  role text,
  created_at timestamptz,
  phone text,
  order_count bigint,
  last_order_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_store_admin() then
    raise exception 'not authorized';
  end if;
  return query
    select
      p.id,
      p.role,
      p.created_at,
      (
        select a.phone
        from public.customer_addresses a
        where a.user_id = p.id
        order by a.created_at desc
        limit 1
      ),
      (select count(*) from public.orders o where o.customer_id = p.id),
      (select max(o.created_at) from public.orders o where o.customer_id = p.id)
    from public.profiles p
    where p.role = 'customer'
      and p.archived_at is null
    order by p.created_at desc;
end;
$$;

create or replace function public.admin_archive_customer(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_store_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  update public.profiles
     set archived_at = now()
   where id = p_user_id
     and role = 'customer'
     and archived_at is null;
  if not found then
    raise exception 'العميل غير موجود أو مؤرشف مسبقًا.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_archive_customer(uuid) from public, anon;
grant execute on function public.admin_archive_customer(uuid) to authenticated;
