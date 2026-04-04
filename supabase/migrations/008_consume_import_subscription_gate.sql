-- Enforce server-backed membership for credit consumption when user_subscription_status exists.
-- No row yet: allow (RevenueCat webhook may lag; client gate is primary until mirror exists).
-- Row exists: require entitlement_active OR trial_end_at > now().

create or replace function public.consume_import_credit(
  p_user_id uuid,
  p_property_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_bal integer;
  v_existing_balance integer;
  v_wallet public.user_credit_wallet%rowtype;
  v_sub_ent boolean;
  v_sub_trial timestamptz;
begin
  if auth.uid() is null or auth.uid() is distinct from p_user_id then
    return jsonb_build_object('success', false, 'code', 'forbidden', 'balance_after', null);
  end if;

  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    return jsonb_build_object('success', false, 'code', 'invalid_idempotency_key', 'balance_after', null);
  end if;

  select balance_after into v_existing_balance
  from public.user_credit_ledger
  where idempotency_key = p_idempotency_key
  limit 1;

  if v_existing_balance is not null then
    return jsonb_build_object(
      'success', true,
      'idempotent', true,
      'balance_after', v_existing_balance
    );
  end if;

  insert into public.user_credit_wallet (user_id) values (p_user_id)
  on conflict (user_id) do nothing;

  select * into v_wallet from public.user_credit_wallet where user_id = p_user_id for update;

  if not found then
    return jsonb_build_object('success', false, 'code', 'wallet_not_found', 'balance_after', 0);
  end if;

  select entitlement_active, trial_end_at
  into v_sub_ent, v_sub_trial
  from public.user_subscription_status
  where user_id = p_user_id;

  if found then
    if not (
      coalesce(v_sub_ent, false)
      or (v_sub_trial is not null and v_sub_trial > now())
    ) then
      return jsonb_build_object(
        'success', false,
        'code', 'subscription_required',
        'balance_after', v_wallet.current_balance
      );
    end if;
  end if;

  if v_wallet.current_balance < 1 then
    return jsonb_build_object(
      'success', false,
      'code', 'insufficient_credits',
      'balance_after', v_wallet.current_balance
    );
  end if;

  v_new_bal := v_wallet.current_balance - 1;

  insert into public.user_credit_ledger (
    user_id, entry_type, entry_reason, credit_delta, balance_after,
    related_property_id, idempotency_key, metadata
  ) values (
    p_user_id, 'consume', 'import_credit_consumed', -1, v_new_bal,
    p_property_id, p_idempotency_key,
    jsonb_build_object('property_id', p_property_id)
  );

  update public.user_credit_wallet set
    current_balance = v_new_bal,
    lifetime_credits_used = lifetime_credits_used + 1,
    updated_at = now()
  where user_id = p_user_id;

  return jsonb_build_object('success', true, 'balance_after', v_new_bal);
end;
$$;

comment on function public.consume_import_credit is
  'Consumes one import credit. Requires active entitlement or in-trial when user_subscription_status row exists; idempotent per key.';

-- Align access hint with consume rule (trial + optimistic allow when no mirror row yet).
create or replace function public.get_user_credit_state(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.user_credit_wallet%rowtype;
  v_sub public.user_subscription_status%rowtype;
  v_found_sub boolean := false;
  v_hint boolean;
begin
  if p_user_id is null then
    return jsonb_build_object('error', 'invalid_user_id');
  end if;

  if auth.uid() is distinct from p_user_id and not public.is_service_role() then
    return jsonb_build_object('error', 'forbidden');
  end if;

  select * into v_wallet from public.user_credit_wallet where user_id = p_user_id;
  select * into v_sub from public.user_subscription_status where user_id = p_user_id;
  v_found_sub := v_sub.user_id is not null;

  v_hint :=
    (not v_found_sub)
    or coalesce(v_sub.entitlement_active, false)
    or (v_sub.trial_end_at is not null and v_sub.trial_end_at > now());

  return jsonb_build_object(
    'user_id', p_user_id,
    'wallet', case when v_wallet.user_id is not null then
      jsonb_build_object(
        'current_balance', v_wallet.current_balance,
        'lifetime_credits_granted', v_wallet.lifetime_credits_granted,
        'lifetime_credits_used', v_wallet.lifetime_credits_used,
        'signup_bonus_credits_granted', v_wallet.signup_bonus_credits_granted,
        'monthly_included_credits_granted', v_wallet.monthly_included_credits_granted,
        'purchased_credits_granted', v_wallet.purchased_credits_granted,
        'updated_at', v_wallet.updated_at
      )
    else jsonb_build_object(
      'current_balance', 0,
      'lifetime_credits_granted', 0,
      'lifetime_credits_used', 0,
      'signup_bonus_credits_granted', 0,
      'monthly_included_credits_granted', 0,
      'purchased_credits_granted', 0,
      'updated_at', null
    ) end,
    'subscription', case when v_found_sub then
      jsonb_build_object(
        'entitlement_active', v_sub.entitlement_active,
        'entitlement_source', v_sub.entitlement_source,
        'product_id', v_sub.product_id,
        'original_purchase_date', v_sub.original_purchase_date,
        'latest_purchase_date', v_sub.latest_purchase_date,
        'current_period_start', v_sub.current_period_start,
        'current_period_end', v_sub.current_period_end,
        'trial_start_at', v_sub.trial_start_at,
        'trial_end_at', v_sub.trial_end_at,
        'will_renew', v_sub.will_renew,
        'billing_issue_detected', v_sub.billing_issue_detected,
        'expires_at', v_sub.expires_at,
        'last_webhook_event_at', v_sub.last_webhook_event_at,
        'updated_at', v_sub.updated_at
      )
    else jsonb_build_object(
      'entitlement_active', false,
      'entitlement_source', null,
      'product_id', null,
      'trial_start_at', null,
      'trial_end_at', null,
      'will_renew', null,
      'billing_issue_detected', false,
      'expires_at', null,
      'last_webhook_event_at', null
    ) end,
    'has_app_access_hint', v_hint
  );
end;
$$;

comment on function public.get_user_credit_state is
  'Wallet + subscription JSON; has_app_access_hint true if no mirror row yet, entitlement active, or trial not ended.';
