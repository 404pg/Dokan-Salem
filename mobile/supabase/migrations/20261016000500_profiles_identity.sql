-- Customer identity: persist name + phone on profiles as soon as the customer
-- enters them, so the device has a confirmed identity independent of orders.
-- Owner runs this manually in the Supabase SQL Editor.

-- 1) Identity columns. profiles.phone already exists (store_core.sql:14), so
--    that statement is a no-op kept for idempotency.
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;

-- 3) RPC: save identity (customer's own row only).
create or replace function public.save_customer_profile(
  p_full_name text,
  p_phone text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'يلزم تسجيل الدخول لحفظ بياناتك' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_full_name, ''))) not between 1 and 120 then
    raise exception 'أدخل اسمًا صحيحًا';
  end if;
  if coalesce(p_phone, '') !~ '^\+9647[0-9]{9}$' then
    raise exception 'أدخل رقم هاتف عراقي صالحًا للتواصل';
  end if;
  insert into public.profiles (id, full_name, phone)
  values (v_user_id, btrim(p_full_name), btrim(p_phone))
  on conflict (id) do update
    set full_name = excluded.full_name,
        phone     = excluded.phone;
end;
$$;

revoke all on function public.save_customer_profile(text, text) from public, anon;
grant execute on function public.save_customer_profile(text, text) to authenticated;

-- 4) Safety net: also record identity from the order if the customer skipped
--    the profile step. Same signature as guest_checkout.sql -> grants unchanged.
create or replace function public.create_cod_order(
  p_customer_name text,
  p_phone text,
  p_region_id uuid,
  p_address_details text,
  p_delivery_note text,
  p_expected_delivery_fee_iqd bigint,
  p_items jsonb,
  p_idempotency_key uuid,
  p_save_address boolean default false
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_region public.delivery_regions%rowtype;
  v_branch_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_subtotal bigint := 0;
  v_expected_price bigint;
  v_product record;
  v_item record;
  v_available integer;
begin
  if v_user_id is null then
    raise exception 'يلزم بدء جلسة زائر قبل إتمام الطلب';
  end if;
  if p_idempotency_key is null then
    raise exception 'تعذر التحقق من الطلب. أعد المحاولة';
  end if;
  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':' || p_idempotency_key::text, 0)
  );
  select order_number
  into v_order_number
  from public.orders
  where customer_id = v_user_id and idempotency_key = p_idempotency_key;
  if found then
    return v_order_number;
  end if;
  if length(trim(coalesce(p_customer_name, ''))) not between 1 and 120 then
    raise exception 'أدخل اسمًا صحيحًا لإتمام الطلب';
  end if;
  if coalesce(p_phone, '') !~ '^\+9647[0-9]{9}$' then
    raise exception 'أدخل رقم هاتف عراقي صالحًا للتواصل';
  end if;
  if length(trim(coalesce(p_address_details, ''))) not between 3 and 500 then
    raise exception 'العنوان التفصيلي مطلوب';
  end if;
  if length(coalesce(p_delivery_note, '')) > 500 then
    raise exception 'تعليمات التوصيل طويلة جدًا';
  end if;
  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and 30 then
    raise exception 'السلة فارغة أو تحتوي عددًا غير صالح من المنتجات';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_items) item
    where jsonb_typeof(item) <> 'object'
       or coalesce(item ->> 'product_id', '') !~
          '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
       or coalesce(item ->> 'quantity', '') !~ '^[1-9][0-9]{0,2}$'
       or coalesce(item ->> 'expected_price_iqd', '') !~ '^[1-9][0-9]{0,12}$'
  ) then
    raise exception 'بيانات أحد المنتجات أو كميته غير صالحة';
  end if;
  if exists (
    select item ->> 'product_id'
    from jsonb_array_elements(p_items) item
    group by item ->> 'product_id'
    having count(*) > 1
  ) then
    raise exception 'السلة تحتوي منتجات مكررة';
  end if;

  select *
  into v_region
  from public.delivery_regions
  where id = p_region_id and is_active
  for share;
  if not found then
    raise exception 'منطقة التوصيل المحددة غير متاحة';
  end if;
  if p_expected_delivery_fee_iqd is distinct from v_region.delivery_fee_iqd then
    raise exception 'تغيّرت رسوم التوصيل. راجع الإجمالي ثم أعد المحاولة';
  end if;

  for v_item in
    select (item ->> 'product_id')::uuid as product_id,
           (item ->> 'quantity')::integer as quantity
    from jsonb_array_elements(p_items) item
    order by (item ->> 'product_id')
  loop
    select id, name_ar, sku, price_iqd
    into v_product
    from public.products
    where id = v_item.product_id and is_active
    for share;
    if not found then
      raise exception 'أحد المنتجات لم يعد متاحًا. حدّث السلة ثم أعد المحاولة';
    end if;
    select (item ->> 'expected_price_iqd')::bigint
    into v_expected_price
    from jsonb_array_elements(p_items) item
    where (item ->> 'product_id')::uuid = v_item.product_id;
    if v_expected_price is distinct from v_product.price_iqd then
      raise exception 'تغيّر سعر أحد المنتجات. حدّث السلة ثم راجع الإجمالي';
    end if;
    v_subtotal := v_subtotal + v_product.price_iqd * v_item.quantity;
  end loop;

  select branch.id
  into v_branch_id
  from public.branches branch
  where branch.is_active
    and not exists (
      select 1
      from jsonb_array_elements(p_items) item
      where not exists (
        select 1
        from public.branch_inventory inventory
        where inventory.branch_id = branch.id
          and inventory.product_id = (item ->> 'product_id')::uuid
          and inventory.quantity_on_hand >= (item ->> 'quantity')::integer
      )
    )
  order by branch.sort_order, branch.id
  limit 1;
  if v_branch_id is null then
    raise exception 'لا يتوفر مخزون كافٍ لإتمام الطلب. لم يتم تغيير سلتك';
  end if;

  if coalesce(p_save_address, false) then
    update public.customer_addresses
    set is_default = false
    where user_id = v_user_id and is_default;
    insert into public.customer_addresses (
      user_id, recipient_name, phone, region_id, province_ar,
      neighborhood_ar, address_details, delivery_note, is_default
    ) values (
      v_user_id, trim(p_customer_name), p_phone, v_region.id,
      v_region.province_ar, v_region.neighborhood_ar,
      trim(p_address_details), trim(coalesce(p_delivery_note, '')), true
    );
  end if;

  v_order_number := 'DOK-' || upper(substr(replace(gen_random_uuid::text, '-', ''), 1, 10));
  insert into public.orders (
    order_number, customer_id, idempotency_key, customer_name, phone, region_id,
    province_ar, neighborhood_ar, address_details, delivery_note,
    subtotal_iqd, delivery_fee_iqd, total_iqd
  ) values (
    v_order_number, v_user_id, p_idempotency_key, trim(p_customer_name), p_phone, v_region.id,
    v_region.province_ar, v_region.neighborhood_ar, trim(p_address_details),
    trim(coalesce(p_delivery_note, '')), v_subtotal, v_region.delivery_fee_iqd,
    v_subtotal + v_region.delivery_fee_iqd
  ) returning id into v_order_id;

  -- >>> R4.4: identity safety net (addition vs guest_checkout.sql) <<<
  update public.profiles
     set full_name = coalesce(nullif(btrim(p_customer_name), ''), full_name),
         phone     = coalesce(nullif(btrim(p_phone), ''), phone)
   where id = v_user_id;

  for v_item in
    select (item ->> 'product_id')::uuid as product_id,
           (item ->> 'quantity')::integer as quantity
    from jsonb_array_elements(p_items) item
    order by (item ->> 'product_id')
  loop
    select quantity_on_hand
    into v_available
    from public.branch_inventory
    where branch_id = v_branch_id and product_id = v_item.product_id
    for update;
    if not found or v_available < v_item.quantity then
      raise exception 'تغيّر المخزون أثناء إتمام طلبك. لم يتم تأكيد الطلب';
    end if;

    select name_ar, sku, price_iqd
    into v_product
    from public.products
    where id = v_item.product_id and is_active;
    update public.branch_inventory
    set quantity_on_hand = quantity_on_hand - v_item.quantity,
        updated_at = now()
    where branch_id = v_branch_id and product_id = v_item.product_id;
    insert into public.order_items (
      order_id, product_id, branch_id, product_name_ar, sku,
      unit_price_iqd, quantity, line_total_iqd
    ) values (
      v_order_id, v_item.product_id, v_branch_id, v_product.name_ar,
      v_product.sku, v_product.price_iqd, v_item.quantity,
      v_product.price_iqd * v_item.quantity
    );
  end loop;

  return v_order_number;
end;
$$;

revoke all on function public.create_cod_order(
  text, text, uuid, text, text, bigint, jsonb, uuid, boolean
) from public, anon;

grant execute on function public.create_cod_order(
  text, text, uuid, text, text, bigint, jsonb, uuid, boolean
) to authenticated;

-- 5) Backfill existing identity from each customer's latest order.
update public.profiles p
   set full_name = o.customer_name,
       phone     = coalesce(p.phone, o.phone)
  from (
    select distinct on (customer_id)
           customer_id, customer_name, phone
    from public.orders
    where customer_id is not null
    order by customer_id, created_at desc
  ) o
 where p.id = o.customer_id
   and p.full_name is null
   and length(btrim(coalesce(o.customer_name, ''))) between 1 and 120;
