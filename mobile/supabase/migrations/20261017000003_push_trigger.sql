-- Push webhook: on each order notification INSERT, call the send-push Edge
-- Function asynchronously via pg_net.
--
-- REQUIRES: pg_net extension enabled.
-- REQUIRES: Vault secrets send_push_url and push_shared_secret created by owner.

create extension if not exists pg_net with schema extensions;

create or replace function public.push_notification_webhook()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url    text;
  v_secret text;
begin
  select decrypted_secret into v_url
    from vault.decrypted_secrets where name = 'send_push_url';
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'push_shared_secret';

  -- Silent skip until the owner has configured Vault.
  if v_url is null or v_secret is null then
    return new;
  end if;

  perform net.http_post(
    url  := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', v_secret
    ),
    body := jsonb_build_object(
      'user_id', new.user_id,
      'title',   new.title_ar,
      'body',    new.body_ar,
      'notification_id', new.id
    ),
    timeout_milliseconds := 5000
  );
  return new;
end;
$$;

drop trigger if exists on_customer_notification_push on public.customer_notifications;
create trigger on_customer_notification_push
  after insert on public.customer_notifications
  for each row when (new.kind = 'order')
  execute function public.push_notification_webhook();
