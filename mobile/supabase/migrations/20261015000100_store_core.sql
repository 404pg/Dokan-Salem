create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.create_customer_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone)
  on conflict (id) do update set phone = excluded.phone;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert or update of phone on auth.users
  for each row execute function public.create_customer_profile();

create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null check (length(trim(name_ar)) between 1 and 100),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name_ar text not null check (length(trim(name_ar)) between 1 and 200),
  brand text,
  description_ar text not null default '',
  sku text unique,
  price_iqd bigint not null check (price_iqd between 1 and 1000000000000),
  compare_at_price_iqd bigint check (
    compare_at_price_iqd is null or compare_at_price_iqd >= price_iqd
  ),
  image_urls text[] not null default '{}',
  specifications jsonb not null default '{}',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null check (length(trim(title_ar)) between 1 and 160),
  body_ar text not null default '' check (length(body_ar) <= 500),
  image_url text,
  product_id uuid references public.products(id) on delete set null,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at is null or ends_at is null or ends_at > starts_at)
);

create table public.product_compatibility (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  make text not null,
  model text not null,
  year_from smallint,
  year_to smallint,
  check (year_from is null or year_from between 1900 and 2200),
  check (year_to is null or year_to between 1900 and 2200),
  check (year_from is null or year_to is null or year_to >= year_from),
  unique (product_id, make, model, year_from, year_to)
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  address_ar text not null,
  phone text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.delivery_regions (
  id uuid primary key default gen_random_uuid(),
  province_ar text not null,
  neighborhood_ar text not null,
  delivery_fee_iqd bigint not null check (
    delivery_fee_iqd between 0 and 1000000000
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (province_ar, neighborhood_ar)
);

create table public.branch_inventory (
  branch_id uuid not null references public.branches(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  updated_at timestamptz not null default now(),
  primary key (branch_id, product_id)
);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_name text not null check (length(trim(recipient_name)) between 1 and 120),
  phone text not null check (phone ~ '^\+9647[0-9]{9}$'),
  region_id uuid not null references public.delivery_regions(id),
  province_ar text not null,
  neighborhood_ar text not null,
  address_details text not null check (
    length(trim(address_details)) between 3 and 500
  ),
  delivery_note text not null default '' check (length(delivery_note) <= 500),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index customer_addresses_one_default_per_user
  on public.customer_addresses(user_id) where is_default;

create table public.customer_motorcycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  make text not null check (length(trim(make)) between 1 and 80),
  model text not null check (length(trim(model)) between 1 and 100),
  year smallint check (year is null or year between 1900 and 2200),
  nickname text not null default '' check (length(nickname) <= 80),
  created_at timestamptz not null default now(),
  unique (user_id, make, model, year)
);

create table public.wishlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references auth.users(id),
  idempotency_key uuid not null,
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')
  ),
  customer_name text not null,
  phone text not null check (phone ~ '^\+9647[0-9]{9}$'),
  region_id uuid not null references public.delivery_regions(id),
  province_ar text not null,
  neighborhood_ar text not null,
  address_details text not null,
  delivery_note text not null default '',
  subtotal_iqd bigint not null check (subtotal_iqd > 0),
  delivery_fee_iqd bigint not null check (delivery_fee_iqd >= 0),
  total_iqd bigint not null check (total_iqd = subtotal_iqd + delivery_fee_iqd),
  payment_method text not null default 'cash_on_delivery'
    check (payment_method = 'cash_on_delivery'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, idempotency_key)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  branch_id uuid not null references public.branches(id),
  product_name_ar text not null,
  sku text,
  unit_price_iqd bigint not null check (unit_price_iqd > 0),
  quantity integer not null check (quantity between 1 and 999),
  line_total_iqd bigint not null check (line_total_iqd = unit_price_iqd * quantity),
  created_at timestamptz not null default now()
);

create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique default (
    'MR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  ),
  customer_id uuid not null references auth.users(id) on delete cascade,
  service_type text not null check (service_type in ('workshop', 'onsite')),
  branch_id uuid references public.branches(id),
  motorcycle text not null check (length(trim(motorcycle)) between 2 and 120),
  description text not null check (length(trim(description)) between 5 and 2000),
  preferred_date date,
  status text not null default 'pending_review' check (
    status in ('pending_review', 'confirmed', 'in_progress', 'completed', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((service_type = 'workshop') = (branch_id is not null))
);

create or replace function public.validate_maintenance_preferred_date()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.preferred_date is not null and new.preferred_date < current_date then
    raise exception 'لا يمكن اختيار موعد صيانة في الماضي';
  end if;
  return new;
end;
$$;

create trigger validate_maintenance_preferred_date
  before insert or update of preferred_date on public.maintenance_requests
  for each row execute function public.validate_maintenance_preferred_date();

create table public.customer_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title_ar text not null,
  body_ar text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index customer_notifications_inbox
  on public.customer_notifications(user_id, created_at desc);

create table public.store_settings (
  id smallint primary key default 1 check (id = 1),
  store_name_ar text not null default 'دكان سليم',
  support_phone text,
  updated_at timestamptz not null default now()
);

insert into public.store_settings(id)
values (1)
on conflict (id) do nothing;

create index products_active_category on public.products(category_id) where is_active;
create index inventory_product_availability
  on public.branch_inventory(product_id, branch_id) where quantity_on_hand > 0;
create index customer_orders_timeline
  on public.orders(customer_id, created_at desc);
create index customer_maintenance_timeline
  on public.maintenance_requests(customer_id, created_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'categories', 'products', 'product_compatibility', 'branches',
    'delivery_regions', 'promotions',
    'branch_inventory', 'customer_addresses', 'customer_motorcycles',
    'wishlist_items', 'orders', 'order_items', 'maintenance_requests',
    'customer_notifications', 'store_settings'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.product_compatibility,
  public.branches, public.delivery_regions, public.promotions, public.store_settings
  to anon, authenticated;
grant select, insert, update, delete on all tables in schema public
  to authenticated;
revoke insert, update, delete on public.orders from authenticated;
grant update (status) on public.orders to authenticated;
revoke insert, update, delete on public.customer_notifications from authenticated;
grant update (is_read) on public.customer_notifications to authenticated;

create or replace function public.validate_order_status_transition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status is distinct from new.status and not (
    (old.status = 'pending' and new.status in ('confirmed', 'cancelled'))
    or (old.status = 'confirmed' and new.status in ('preparing', 'cancelled'))
    or (old.status = 'preparing' and new.status in ('out_for_delivery', 'cancelled'))
    or (old.status = 'out_for_delivery' and new.status in ('delivered', 'cancelled'))
  ) then
    raise exception 'لا يمكن نقل الطلب من الحالة الحالية إلى الحالة المطلوبة';
  end if;
  return new;
end;
$$;

create trigger validate_order_status_transition
  before update of status on public.orders
  for each row execute function public.validate_order_status_transition();

create or replace function public.validate_maintenance_status_transition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status is distinct from new.status and not (
    (old.status = 'pending_review' and new.status in ('confirmed', 'cancelled'))
    or (old.status = 'confirmed' and new.status in ('in_progress', 'cancelled'))
    or (old.status = 'in_progress' and new.status in ('completed', 'cancelled'))
  ) then
    raise exception 'لا يمكن نقل طلب الصيانة من الحالة الحالية إلى الحالة المطلوبة';
  end if;
  return new;
end;
$$;

create trigger validate_maintenance_status_transition
  before update of status on public.maintenance_requests
  for each row execute function public.validate_maintenance_status_transition();

create policy profiles_read_owner_or_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_store_admin());
create policy profiles_admin_manage on public.profiles
  for update to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

create policy promotions_public_read on public.promotions
  for select to anon, authenticated
  using (is_active or public.is_store_admin());
create policy promotions_admin_manage on public.promotions
  for all to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

create policy categories_public_read on public.categories
  for select to anon, authenticated
  using (is_active or public.is_store_admin());
create policy categories_admin_manage on public.categories
  for all to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

create policy products_public_read on public.products
  for select to anon, authenticated
  using (is_active or public.is_store_admin());
create policy products_admin_manage on public.products
  for all to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

create policy compatibility_public_read on public.product_compatibility
  for select to anon, authenticated
  using (true);
create policy compatibility_admin_manage on public.product_compatibility
  for all to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

create policy branches_public_read on public.branches
  for select to anon, authenticated
  using (is_active or public.is_store_admin());
create policy branches_admin_manage on public.branches
  for all to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

create policy delivery_regions_public_read on public.delivery_regions
  for select to anon, authenticated
  using (is_active or public.is_store_admin());
create policy delivery_regions_admin_manage on public.delivery_regions
  for all to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

create policy inventory_admin_manage on public.branch_inventory
  for all to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

create policy addresses_owner_manage on public.customer_addresses
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy motorcycles_owner_manage on public.customer_motorcycles
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy wishlist_owner_manage on public.wishlist_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy orders_customer_or_admin_read on public.orders
  for select to authenticated
  using (customer_id = (select auth.uid()) or public.is_store_admin());
create policy orders_admin_update on public.orders
  for update to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

create policy order_items_customer_or_admin_read on public.order_items
  for select to authenticated
  using (
    public.is_store_admin()
    or exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.customer_id = (select auth.uid())
    )
  );

create policy maintenance_customer_read on public.maintenance_requests
  for select to authenticated
  using (customer_id = (select auth.uid()) or public.is_store_admin());
create policy maintenance_customer_create on public.maintenance_requests
  for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    and status = 'pending_review'
  );
create policy maintenance_admin_update on public.maintenance_requests
  for update to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

create policy notifications_owner_read on public.customer_notifications
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy notifications_owner_update on public.customer_notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy settings_public_read on public.store_settings
  for select to anon, authenticated
  using (true);
create policy settings_admin_manage on public.store_settings
  for all to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

create or replace function public.save_customer_address(
  p_recipient_name text,
  p_phone text,
  p_region_id uuid,
  p_address_details text,
  p_delivery_note text default '',
  p_address_id uuid default null,
  p_is_default boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_region public.delivery_regions%rowtype;
  v_address_id uuid;
begin
  if v_user_id is null then
    raise exception 'يلزم تسجيل الدخول لحفظ العنوان';
  end if;
  if length(trim(coalesce(p_recipient_name, ''))) not between 1 and 120
     or coalesce(p_phone, '') !~ '^\+9647[0-9]{9}$'
     or length(trim(coalesce(p_address_details, ''))) not between 3 and 500
     or length(coalesce(p_delivery_note, '')) > 500 then
    raise exception 'تحقق من الاسم ورقم الهاتف والعنوان';
  end if;
  select *
  into v_region
  from public.delivery_regions
  where id = p_region_id and is_active
  for share;
  if not found then
    raise exception 'منطقة التوصيل المحددة غير متاحة';
  end if;
  if p_address_id is not null and not exists (
    select 1 from public.customer_addresses
    where id = p_address_id and user_id = v_user_id
  ) then
    raise exception 'لم يتم العثور على العنوان';
  end if;

  if p_is_default then
    update public.customer_addresses
    set is_default = false
    where user_id = v_user_id and is_default
      and (p_address_id is null or id <> p_address_id);
  end if;

  if p_address_id is null then
    insert into public.customer_addresses (
      user_id, recipient_name, phone, region_id, province_ar,
      neighborhood_ar, address_details, delivery_note, is_default
    ) values (
      v_user_id, trim(p_recipient_name), p_phone, v_region.id,
      v_region.province_ar, v_region.neighborhood_ar,
      trim(p_address_details), trim(coalesce(p_delivery_note, '')), p_is_default
    ) returning id into v_address_id;
  else
    update public.customer_addresses
    set recipient_name = trim(p_recipient_name),
        phone = p_phone,
        region_id = v_region.id,
        province_ar = v_region.province_ar,
        neighborhood_ar = v_region.neighborhood_ar,
        address_details = trim(p_address_details),
        delivery_note = trim(coalesce(p_delivery_note, '')),
        is_default = p_is_default
    where id = p_address_id and user_id = v_user_id
    returning id into v_address_id;
  end if;
  return v_address_id;
end;
$$;

grant execute on function public.save_customer_address(
  text, text, uuid, text, text, uuid, boolean
) to authenticated;

create or replace function public.get_catalog_products(
  p_category_id uuid default null,
  p_search text default ''
)
returns table (
  id uuid,
  category_id uuid,
  name_ar text,
  brand text,
  description_ar text,
  sku text,
  price_iqd bigint,
  compare_at_price_iqd bigint,
  image_urls text[],
  specifications jsonb,
  is_available boolean,
  compatible_models jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.category_id,
    p.name_ar,
    p.brand,
    p.description_ar,
    p.sku,
    p.price_iqd,
    p.compare_at_price_iqd,
    p.image_urls,
    p.specifications,
    exists (
      select 1
      from public.branch_inventory inventory
      join public.branches branch on branch.id = inventory.branch_id
      where inventory.product_id = p.id
        and inventory.quantity_on_hand > 0
        and branch.is_active
    ) as is_available,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'make', fitment.make,
        'model', fitment.model,
        'year_from', fitment.year_from,
        'year_to', fitment.year_to
      ) order by fitment.make, fitment.model)
      from public.product_compatibility fitment
      where fitment.product_id = p.id
    ), '[]'::jsonb) as compatible_models
  from public.products p
  where p.is_active
    and (p_category_id is null or p.category_id = p_category_id)
    and (
      nullif(trim(p_search), '') is null
      or p.name_ar ilike '%' || trim(p_search) || '%'
      or coalesce(p.brand, '') ilike '%' || trim(p_search) || '%'
      or coalesce(p.sku, '') ilike '%' || trim(p_search) || '%'
    )
  order by p.created_at desc, p.id;
$$;

grant execute on function public.get_catalog_products(uuid, text) to anon, authenticated;

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
  v_auth_phone text;
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
    raise exception 'يلزم تسجيل الدخول قبل إتمام الطلب';
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
  select phone into v_auth_phone from auth.users where id = v_user_id;
  if length(trim(coalesce(p_customer_name, ''))) not between 1 and 120 then
    raise exception 'أدخل اسمًا صحيحًا لإتمام الطلب';
  end if;
  if coalesce(p_phone, '') !~ '^\+9647[0-9]{9}$' then
    raise exception 'رقم الهاتف الموثق غير صالح';
  end if;
  if p_phone is distinct from v_auth_phone then
    raise exception 'استخدم رقم الهاتف الذي تحققت منه لتأكيد الطلب';
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

  v_order_number := 'DOK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
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

grant execute on function public.create_cod_order(
  text, text, uuid, text, text, bigint, jsonb, uuid, boolean
) to authenticated;

create or replace function public.cancel_pending_cod_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if auth.uid() is null then
    raise exception 'يلزم تسجيل الدخول';
  end if;
  select *
  into v_order
  from public.orders
  where id = p_order_id and customer_id = auth.uid()
  for update;
  if not found then
    raise exception 'لم يتم العثور على الطلب';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'لا يمكن إلغاء الطلب بعد بدء تجهيزه';
  end if;
  update public.orders set status = 'cancelled' where id = p_order_id;
end;
$$;

grant execute on function public.cancel_pending_cod_order(uuid) to authenticated;

create or replace function public.release_cancelled_order_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status <> 'cancelled' and new.status = 'cancelled' then
    update public.branch_inventory inventory
    set quantity_on_hand = inventory.quantity_on_hand + item.quantity,
        updated_at = now()
    from public.order_items item
    where item.order_id = new.id
      and item.branch_id = inventory.branch_id
      and item.product_id = inventory.product_id;
  end if;
  return new;
end;
$$;

create trigger release_cancelled_order_inventory
  after update of status on public.orders
  for each row execute function public.release_cancelled_order_inventory();

create or replace function public.notify_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.customer_notifications(user_id, title_ar, body_ar)
    values (
      new.customer_id,
      'تحديث طلبك',
      'تغيّرت حالة الطلب ' || new.order_number || ' إلى ' ||
      case new.status
        when 'pending' then 'بانتظار التأكيد'
        when 'confirmed' then 'مؤكد'
        when 'preparing' then 'قيد التجهيز'
        when 'out_for_delivery' then 'في الطريق إليك'
        when 'delivered' then 'تم التسليم'
        when 'cancelled' then 'ملغي'
      end
    );
  end if;
  return new;
end;
$$;

create trigger notify_order_status_change
  after update of status on public.orders
  for each row execute function public.notify_order_status_change();

create or replace function public.notify_maintenance_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.customer_notifications(user_id, title_ar, body_ar)
    values (
      new.customer_id,
      'تحديث طلب الصيانة',
      'تغيّرت حالة طلب الصيانة ' || new.request_number || ' إلى ' ||
      case new.status
        when 'pending_review' then 'بانتظار المراجعة'
        when 'confirmed' then 'مؤكد'
        when 'in_progress' then 'قيد التنفيذ'
        when 'completed' then 'مكتمل'
        when 'cancelled' then 'ملغي'
      end
    );
  end if;
  return new;
end;
$$;

create trigger notify_maintenance_status_change
  after update of status on public.maintenance_requests
  for each row execute function public.notify_maintenance_status_change();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'categories', 'products', 'branches', 'delivery_regions',
    'promotions',
    'customer_addresses', 'orders', 'maintenance_requests', 'store_settings'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      table_name || '_set_updated_at',
      table_name
    );
  end loop;
end;
$$;
