-- Promotion notifications: fan out one customer_notifications row to every
-- customer when a promotion becomes active. Additive and safe; the local API
-- path is unaffected. customer_notifications has no insert grant for
-- authenticated (writes are trigger-only), so this function is security definer.

create or replace function public.notify_promotion_active()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_count integer;
begin
  -- Only when the promotion is (or becomes) active.
  if new.is_active is not true then
    return new;
  end if;

  -- INSERT -> always notify; UPDATE -> only on an actual is_active change.
  -- (Guard also avoids referencing OLD on INSERT.)
  if tg_op = 'UPDATE' and old.is_active is not distinct from new.is_active then
    return new;
  end if;

  -- Single set-based insert (efficient even for 1000 customers; no per-row loop).
  insert into public.customer_notifications (user_id, title_ar, body_ar, is_read)
  select
    p.id,
    new.title_ar,
    coalesce(nullif(btrim(new.body_ar), ''), new.title_ar),
    false
  from public.profiles p
  where p.role = 'customer';

  get diagnostics recipient_count = row_count;

  -- No cap by default: capping would silently drop customers. Log large fan-outs.
  if recipient_count > 500 then
    raise warning 'promotion % notified % customers', new.id, recipient_count;
  end if;

  return new;
end;
$$;

create trigger on_promotion_active
  after insert or update of is_active on public.promotions
  for each row execute function public.notify_promotion_active();
