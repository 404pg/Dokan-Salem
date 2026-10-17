-- Order status notifications: replace the generic body from store_core.sql.
-- The trigger notify_order_status_change (after update of status on public.orders,
-- for each row) already exists and will now call this richer per-status copy.
-- No second trigger is created (avoids duplicate notifications).
-- customer_notifications is trigger-only (no INSERT grant for authenticated),
-- hence security definer.
-- Owner runs this manually in the Supabase SQL Editor.

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
  -- Guard: the existing trigger has no WHEN clause, and `update of status`
  -- fires even when the value is unchanged.
  if old.status is not distinct from new.status then
    return new;
  end if;

  -- Defensive: orders.customer_id is NOT NULL, so this never triggers.
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

  insert into public.customer_notifications (user_id, title_ar, body_ar, is_read)
  values (new.customer_id, v_title, v_body, false);

  return new;
end;
$$;

revoke all on function public.notify_order_status_change() from public, anon;
