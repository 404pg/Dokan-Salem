-- Customer overview: expose name, latest address and saved motorcycles so the
-- Admin «العملاء» page can show more than the phone number.
-- Return signature changes, so the old function must be dropped first.
-- Owner runs this manually in the Supabase SQL Editor.
--
-- DEPENDS ON: 20261016000300 (archived_at column)
-- DEPENDS ON: 20261016000500 (full_name column)

drop function if exists public.admin_customer_overview();

create or replace function public.admin_customer_overview()
returns table (
  id uuid,
  role text,
  created_at timestamptz,
  full_name text,
  phone text,
  address text,
  motorcycle text,
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
      coalesce(
        nullif(btrim(p.full_name), ''),
        (select o.customer_name from public.orders o
         where o.customer_id = p.id
         order by o.created_at desc limit 1)
      ) as full_name,
      coalesce(
        nullif(btrim(p.phone), ''),
        (select a.phone from public.customer_addresses a
         where a.user_id = p.id
         order by a.created_at desc limit 1)
      ) as phone,
      (select concat_ws(' - ', a.province_ar, a.neighborhood_ar, a.address_details)
       from public.customer_addresses a
       where a.user_id = p.id
       order by a.is_default desc, a.created_at desc
       limit 1) as address,
      (select string_agg(
                coalesce(nullif(m.nickname, ''), m.make || ' ' || m.model),
                '، '
              )
       from public.customer_motorcycles m
       where m.user_id = p.id) as motorcycle,
      (select count(*) from public.orders o where o.customer_id = p.id) as order_count,
      (select max(o.created_at) from public.orders o where o.customer_id = p.id) as last_order_at
    from public.profiles p
    where p.role = 'customer'
      and p.archived_at is null
    order by p.created_at desc;
end;
$$;

revoke all on function public.admin_customer_overview() from public, anon;
grant execute on function public.admin_customer_overview() to authenticated;
