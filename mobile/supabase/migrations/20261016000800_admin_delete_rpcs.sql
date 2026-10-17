-- Admin cleanup RPCs: allow the store owner to clear test data safely with
-- Arabic, referential-integrity-aware errors. All are security definer + admin
-- gated. Leaf deletes are hard deletes; products/customers are archived.
-- Owner runs this manually in the Supabase SQL Editor.

-- 1) Archive product (never hard-delete: order history references it).
create or replace function public.admin_archive_product(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_store_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  update public.products
     set is_active = false,
         updated_at = now()
   where id = p_id;
  if not found then
    raise exception 'المنتج غير موجود.' using errcode = 'P0002';
  end if;
end;
$$;

-- 2) Delete category (block if products reference it).
create or replace function public.admin_delete_category(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count bigint;
begin
  if not public.is_store_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select count(*) into v_count from public.products where category_id = p_id;
  if v_count > 0 then
    raise exception 'لا يمكن حذف هذا القسم لوجود % منتجات مرتبطة به. انقل المنتجات لقسم آخر أولاً.', v_count
      using errcode = 'P0001';
  end if;
  delete from public.categories where id = p_id;
  if not found then
    raise exception 'القسم غير موجود.' using errcode = 'P0002';
  end if;
end;
$$;

-- 3) Delete branch (block if orders, maintenance or inventory exist).
create or replace function public.admin_delete_branch(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orders bigint;
  v_maint  bigint;
  v_inv    bigint;
begin
  if not public.is_store_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select count(*) into v_orders from public.order_items           where branch_id = p_id;
  if v_orders > 0 then
    raise exception 'لا يمكن حذف هذا الفرع لوجود % عناصر طلبات مرتبطة به.', v_orders
      using errcode = 'P0001';
  end if;
  select count(*) into v_maint from public.maintenance_requests   where branch_id = p_id;
  if v_maint > 0 then
    raise exception 'لا يمكن حذف هذا الفرع لوجود % طلبات صيانة مرتبطة به.', v_maint
      using errcode = 'P0001';
  end if;
  select count(*) into v_inv   from public.branch_inventory       where branch_id = p_id;
  if v_inv > 0 then
    raise exception 'لا يمكن حذف هذا الفرع لوجود % سجلات مخزون مرتبطة به. احذف المخزون أولاً.', v_inv
      using errcode = 'P0001';
  end if;
  delete from public.branches where id = p_id;
  if not found then
    raise exception 'الفرع غير موجود.' using errcode = 'P0002';
  end if;
end;
$$;

-- 4) Delete delivery region (block if addresses OR orders reference it).
create or replace function public.admin_delete_region(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_addr   bigint;
  v_orders bigint;
begin
  if not public.is_store_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select count(*) into v_addr from public.customer_addresses where region_id = p_id;
  if v_addr > 0 then
    raise exception 'لا يمكن حذف هذه المنطقة لوجود % عناوين عملاء مرتبطة بها.', v_addr
      using errcode = 'P0001';
  end if;
  select count(*) into v_orders from public.orders where region_id = p_id;
  if v_orders > 0 then
    raise exception 'لا يمكن حذف هذه المنطقة لوجود % طلبات مرتبطة بها.', v_orders
      using errcode = 'P0001';
  end if;
  delete from public.delivery_regions where id = p_id;
  if not found then
    raise exception 'المنطقة غير موجودة.' using errcode = 'P0002';
  end if;
end;
$$;

-- 5) Delete promotion (leaf — hard delete).
create or replace function public.admin_delete_promotion(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_store_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  delete from public.promotions where id = p_id;
  if not found then
    raise exception 'العرض غير موجود.' using errcode = 'P0002';
  end if;
end;
$$;

-- 6) Delete inventory row (composite key, leaf — hard delete).
create or replace function public.admin_delete_inventory(p_branch_id uuid, p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_store_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  delete from public.branch_inventory
   where branch_id = p_branch_id
     and product_id = p_product_id;
  if not found then
    raise exception 'سجل المخزون غير موجود.' using errcode = 'P0002';
  end if;
end;
$$;

-- 7) Delete a single order (order_items cascade; stock NOT restored — Option A).
create or replace function public.admin_delete_order(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_store_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  delete from public.orders where id = p_id;
  if not found then
    raise exception 'الطلب غير موجود.' using errcode = 'P0002';
  end if;
end;
$$;

-- 8) Clear ALL orders (bulk, dangerous). Returns the number deleted.
create or replace function public.admin_clear_all_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not public.is_store_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select count(*) into v_count from public.orders;
  delete from public.orders;
  return v_count;
end;
$$;

-- Grants (RPCs are internal-only for anon/public).
revoke all on function public.admin_archive_product(uuid)             from public, anon;
revoke all on function public.admin_delete_category(uuid)             from public, anon;
revoke all on function public.admin_delete_branch(uuid)               from public, anon;
revoke all on function public.admin_delete_region(uuid)               from public, anon;
revoke all on function public.admin_delete_promotion(uuid)            from public, anon;
revoke all on function public.admin_delete_inventory(uuid, uuid)      from public, anon;
revoke all on function public.admin_delete_order(uuid)                from public, anon;
revoke all on function public.admin_clear_all_orders()                from public, anon;

grant execute on function public.admin_archive_product(uuid)          to authenticated;
grant execute on function public.admin_delete_category(uuid)          to authenticated;
grant execute on function public.admin_delete_branch(uuid)            to authenticated;
grant execute on function public.admin_delete_region(uuid)            to authenticated;
grant execute on function public.admin_delete_promotion(uuid)         to authenticated;
grant execute on function public.admin_delete_inventory(uuid, uuid)   to authenticated;
grant execute on function public.admin_delete_order(uuid)             to authenticated;
grant execute on function public.admin_clear_all_orders()             to authenticated;
