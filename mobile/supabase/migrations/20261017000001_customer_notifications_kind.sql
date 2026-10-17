-- Notification kind discriminator so the push trigger can target order
-- notifications only (avoids promotion fan-out spamming FCM).
-- Owner runs this manually in the Supabase SQL Editor.

-- 1) Column + constraint (idempotent).
alter table public.customer_notifications
  add column if not exists kind text not null default 'general';

alter table public.customer_notifications
  drop constraint if exists customer_notifications_kind_check;
alter table public.customer_notifications
  add constraint customer_notifications_kind_check
  check (kind in ('order', 'promotion', 'maintenance', 'general'));

-- 2) Order status notifications -> kind 'order'.
--    (Richer per-status copy from 20261016000700, plus kind.)
create or replace function public.notify_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_body  text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;
  if new.customer_id is null then
    return new;
  end if;

  case new.status
    when 'confirmed' then
      v_title := '✅ تم تأكيد طلبك';
      v_body  := 'طلبك ' || new.order_number || ' تم تأكيده وسيبدأ التجهيز قريباً.';
    when 'preparing' then
      v_title := '📦 طلبك قيد التجهيز';
      v_body  := 'نعمل على تجهيز طلبك ' || new.order_number || '.';
    when 'out_for_delivery' then
      v_title := '🛵 طلبك في الطريق';
      v_body  := 'المندوب في طريقه إليك. طلبك ' || new.order_number || '.';
    when 'delivered' then
      v_title := '🎉 تم تسليم طلبك';
      v_body  := 'نشكرك على الشراء. طلبك ' || new.order_number || ' تم تسليمه بنجاح.';
    when 'cancelled' then
      v_title := '❌ تم إلغاء طلبك';
      v_body  := 'تم إلغاء طلبك ' || new.order_number || '. للاستفسار، تواصل معنا.';
    else
      return new;  -- 'pending' or unknown: no notification
  end case;

  insert into public.customer_notifications (user_id, title_ar, body_ar, is_read, kind)
  values (new.customer_id, v_title, v_body, false, 'order');

  return new;
end;
$$;

revoke all on function public.notify_order_status_change() from public, anon;

-- 3) Promotion notifications -> kind 'promotion'.
create or replace function public.notify_promotion_active()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_count integer;
begin
  if new.is_active is not true then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.is_active is not distinct from new.is_active then
    return new;
  end if;

  insert into public.customer_notifications (user_id, title_ar, body_ar, is_read, kind)
  select
    p.id,
    new.title_ar,
    coalesce(nullif(btrim(new.body_ar), ''), new.title_ar),
    false,
    'promotion'
  from public.profiles p
  where p.role = 'customer';

  get diagnostics recipient_count = row_count;
  if recipient_count > 500 then
    raise warning 'promotion % notified % customers', new.id, recipient_count;
  end if;
  return new;
end;
$$;

-- 4) Maintenance notifications -> kind 'maintenance'.
create or replace function public.notify_maintenance_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.customer_notifications (user_id, title_ar, body_ar, kind)
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
      end,
      'maintenance'
    );
  end if;
  return new;
end;
$$;
