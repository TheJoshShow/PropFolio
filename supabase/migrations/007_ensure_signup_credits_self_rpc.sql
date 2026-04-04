-- Idempotent signup credit grant callable by the authenticated user (mobile app after sign-in).
-- Pairs with handle_new_user + grant_signup_credits: same ledger keys; safe if the trigger already ran
-- or if a rare trigger failure left the wallet unseeded.

create or replace function public.ensure_signup_credits_self()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  return public.grant_signup_credits(v_uid);
end;
$$;

revoke all on function public.ensure_signup_credits_self() from public;
grant execute on function public.ensure_signup_credits_self() to authenticated;

comment on function public.ensure_signup_credits_self is
  'Calls grant_signup_credits(auth.uid()) once per user (idempotent). Invoke after session is established.';
