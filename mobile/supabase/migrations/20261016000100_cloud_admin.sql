-- Cloud admin support: read-only aggregate RPCs. No table or column changes.
-- Additive and safe: the local API path and existing RLS are unaffected.

create or replace function public.admin_store_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_store_admin() then
    raise exception 'not authorized';
  end if;
  return (
    select jsonb_build_object(
      'order_count', (select count(*) from public.orders),
      'product_count', (select count(*) from public.products),
      'open_maintenance_count', (
        select count(*)
        from public.maintenance_requests
        where status in ('pending_review', 'confirmed', 'in_progress')
      ),
      'recent_delivered_revenue_iqd', (
        select coalesce(sum(total_iqd), 0)
        from (
          select total_iqd
          from public.orders
          where status = 'delivered'
          order by created_at desc
          limit 5
        ) recent
      )
    )
  );
end;
$$;

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
    order by p.created_at desc;
end;
$$;

revoke all on function public.admin_store_summary() from public, anon;
revoke all on function public.admin_customer_overview() from public, anon;

grant execute on function public.admin_store_summary() to authenticated;
grant execute on function public.admin_customer_overview() to authenticated;
