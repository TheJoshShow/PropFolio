-- PropFolio: subscription mirror + auditable credit wallet + ledger + purchase events.
-- Server-side source of truth for credits. Client reads via RLS; mutations via SECURITY DEFINER RPCs / service_role.
--
-- Related legacy tables (unchanged here, for gradual migration):
--   public.subscription_status — still used by revenuecat-webhook until that function is repointed.
--   public.usage_limits / increment_property_import_usage — legacy import counter; deprecate in favor of consume_import_credit.

-- ---------------------------------------------------------------------------
-- 1) user_subscription_status — per-user subscription snapshot (webhook / admin writes)
-- ---------------------------------------------------------------------------
create table if not exists public.user_subscription_status (
  user_id uuid primary key references auth.users (id) on delete cascade,
  entitlement_active boolean not null default false,
  entitlement_source text,
  product_id text,
  original_purchase_date timestamptz,
  latest_purchase_date timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_start_at timestamptz,
  trial_end_at timestamptz,
  will_renew boolean,
  billing_issue_detected boolean not null default false,
  expires_at timestamptz,
  last_webhook_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_subscription_status_entitlement_idx
  on public.user_subscription_status (user_id, entitlement_active);

comment on table public.user_subscription_status is
  'Mirror of store/RevenueCat subscription state; updated by Edge webhooks with service role. Drives app access after trial.';

-- ---------------------------------------------------------------------------
-- 2) app_purchase_events — normalized purchase / webhook payloads (inserted before credit grants)
-- ---------------------------------------------------------------------------
create table if not exists public.app_purchase_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  source text not null default 'RevenueCat',
  event_type text not null,
  product_id text,
  transaction_id text,
  original_transaction_id text,
  app_user_id text,
  idempotency_key text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint app_purchase_events_idempotency_key_unique unique (idempotency_key)
);

create index if not exists app_purchase_events_user_created_idx
  on public.app_purchase_events (user_id, created_at desc);
create index if not exists app_purchase_events_transaction_idx
  on public.app_purchase_events (transaction_id)
  where transaction_id is not null;

comment on table public.app_purchase_events is
  'Append-only purchase/webhook audit; idempotency_key prevents duplicate processing.';

-- ---------------------------------------------------------------------------
-- 3) user_credit_wallet — materialized balance + lifetime counters (no direct client writes)
-- ---------------------------------------------------------------------------
create table if not exists public.user_credit_wallet (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_balance integer not null default 0,
  lifetime_credits_granted integer not null default 0,
  lifetime_credits_used integer not null default 0,
  signup_bonus_credits_granted integer not null default 0,
  monthly_included_credits_granted integer not null default 0,
  purchased_credits_granted integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_credit_wallet_balance_non_negative check (current_balance >= 0),
  constraint user_credit_wallet_counters_non_negative check (
    lifetime_credits_granted >= 0
    and lifetime_credits_used >= 0
    and signup_bonus_credits_granted >= 0
    and monthly_included_credits_granted >= 0
    and purchased_credits_granted >= 0
  )
);

comment on table public.user_credit_wallet is
  'Spendable credit balance and summary counters; updated only via credit RPCs/triggers.';

-- ---------------------------------------------------------------------------
-- 4) user_credit_ledger — append-only credit movements
-- ---------------------------------------------------------------------------
create table if not exists public.user_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_type text not null,
  entry_reason text not null,
  credit_delta integer not null,
  balance_after integer not null,
  related_property_id uuid,
  related_purchase_event_id uuid references public.app_purchase_events (id) on delete set null,
  related_period_start timestamptz,
  related_period_end timestamptz,
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint user_credit_ledger_idempotency_key_unique unique (idempotency_key),
  constraint user_credit_ledger_entry_type_check check (
    entry_type in ('grant', 'consume', 'refund', 'adjustment', 'expiration')
  ),
  constraint user_credit_ledger_entry_reason_check check (
    entry_reason in (
      'signup_bonus_grant',
      'monthly_credit_grant',
      'consumable_purchase_grant',
      'import_credit_consumed',
      'admin_adjustment',
      'refund_reversal',
      'expiration_adjustment'
    )
  )
);

create index if not exists user_credit_ledger_user_created_idx
  on public.user_credit_ledger (user_id, created_at desc);
create index if not exists user_credit_ledger_property_idx
  on public.user_credit_ledger (related_property_id)
  where related_property_id is not null;

comment on table public.user_credit_ledger is
  'Append-only ledger; UPDATE/DELETE blocked by trigger. idempotency_key prevents duplicate webhook/signup grants.';

-- ---------------------------------------------------------------------------
-- Append-only enforcement on ledger
-- ---------------------------------------------------------------------------
create or replace function public.prevent_user_credit_ledger_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'user_credit_ledger is append-only';
end;
$$;

drop trigger if exists user_credit_ledger_no_update on public.user_credit_ledger;
create trigger user_credit_ledger_no_update
  before update on public.user_credit_ledger
  for each row execute function public.prevent_user_credit_ledger_mutation();

drop trigger if exists user_credit_ledger_no_delete on public.user_credit_ledger;
create trigger user_credit_ledger_no_delete
  before delete on public.user_credit_ledger
  for each row execute function public.prevent_user_credit_ledger_mutation();

-- ---------------------------------------------------------------------------
-- Wallet updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_user_credit_wallet_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_credit_wallet_set_updated_at on public.user_credit_wallet;
create trigger user_credit_wallet_set_updated_at
  before update on public.user_credit_wallet
  for each row execute function public.set_user_credit_wallet_updated_at();

create or replace function public.set_user_subscription_status_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_subscription_status_set_updated_at on public.user_subscription_status;
create trigger user_subscription_status_set_updated_at
  before update on public.user_subscription_status
  for each row execute function public.set_user_subscription_status_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.user_subscription_status enable row level security;
alter table public.user_credit_wallet enable row level security;
alter table public.user_credit_ledger enable row level security;
alter table public.app_purchase_events enable row level security;

drop policy if exists "user_subscription_status_select_own" on public.user_subscription_status;
create policy "user_subscription_status_select_own"
  on public.user_subscription_status for select
  using (auth.uid() = user_id);

drop policy if exists "user_credit_wallet_select_own" on public.user_credit_wallet;
create policy "user_credit_wallet_select_own"
  on public.user_credit_wallet for select
  using (auth.uid() = user_id);

drop policy if exists "user_credit_ledger_select_own" on public.user_credit_ledger;
create policy "user_credit_ledger_select_own"
  on public.user_credit_ledger for select
  using (auth.uid() = user_id);

drop policy if exists "app_purchase_events_select_own" on public.app_purchase_events;
create policy "app_purchase_events_select_own"
  on public.app_purchase_events for select
  using (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE for authenticated on these tables (service_role bypasses RLS)

-- ---------------------------------------------------------------------------
-- Helper: is caller Supabase service_role (for webhook RPCs)
-- ---------------------------------------------------------------------------
create or replace function public.is_service_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select auth.jwt() ->> 'role'),
    current_setting('request.jwt.claim.role', true)
  ) = 'service_role';
$$;

-- ---------------------------------------------------------------------------
-- 1) grant_signup_credits — exactly +2 signup_bonus + +1 monthly (3 total), idempotent
-- ---------------------------------------------------------------------------
create or replace function public.grant_signup_credits(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bonus_key text := 'signup_bonus_grant:' || p_user_id::text;
  v_monthly_key text := 'signup_monthly_included:' || p_user_id::text;
  v_bal integer;
  v_row public.user_credit_wallet%rowtype;
begin
  if p_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_user_id');
  end if;

  insert into public.user_credit_wallet (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select * into v_row from public.user_credit_wallet where user_id = p_user_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'wallet_missing');
  end if;

  v_bal := v_row.current_balance;

  -- Already fully granted?
  if exists (select 1 from public.user_credit_ledger where idempotency_key = v_bonus_key)
     and exists (select 1 from public.user_credit_ledger where idempotency_key = v_monthly_key) then
    return jsonb_build_object(
      'ok', true,
      'already_granted', true,
      'current_balance', v_row.current_balance
    );
  end if;

  -- +2 signup bonus (idempotent step)
  if not exists (select 1 from public.user_credit_ledger where idempotency_key = v_bonus_key) then
    v_bal := v_bal + 2;
    insert into public.user_credit_ledger (
      user_id, entry_type, entry_reason, credit_delta, balance_after,
      idempotency_key, metadata
    ) values (
      p_user_id, 'grant', 'signup_bonus_grant', 2, v_bal,
      v_bonus_key, jsonb_build_object('step', 'signup_bonus', 'credits', 2)
    );
    update public.user_credit_wallet set
      current_balance = v_bal,
      lifetime_credits_granted = lifetime_credits_granted + 2,
      signup_bonus_credits_granted = signup_bonus_credits_granted + 2,
      updated_at = now()
    where user_id = p_user_id;
  else
    select current_balance into v_bal from public.user_credit_wallet where user_id = p_user_id;
  end if;

  -- +1 first-cycle monthly included (idempotent step)
  if not exists (select 1 from public.user_credit_ledger where idempotency_key = v_monthly_key) then
    v_bal := v_bal + 1;
    insert into public.user_credit_ledger (
      user_id, entry_type, entry_reason, credit_delta, balance_after,
      idempotency_key, metadata,
      related_period_start, related_period_end
    ) values (
      p_user_id, 'grant', 'monthly_credit_grant', 1, v_bal,
      v_monthly_key, jsonb_build_object('step', 'signup_monthly_included', 'credits', 1),
      date_trunc('month', now()), (date_trunc('month', now()) + interval '1 month - 1 day')
    );
    update public.user_credit_wallet set
      current_balance = v_bal,
      lifetime_credits_granted = lifetime_credits_granted + 1,
      monthly_included_credits_granted = monthly_included_credits_granted + 1,
      updated_at = now()
    where user_id = p_user_id;
  end if;

  select current_balance into v_bal from public.user_credit_wallet where user_id = p_user_id;

  return jsonb_build_object('ok', true, 'current_balance', v_bal);
end;
$$;

comment on function public.grant_signup_credits is
  'Idempotent: grants 2 signup_bonus_grant + 1 monthly_credit_grant. Called from handle_new_user trigger.';

-- ---------------------------------------------------------------------------
-- 2) grant_monthly_included_credit — service_role only
-- ---------------------------------------------------------------------------
create or replace function public.grant_monthly_included_credit(
  p_user_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bal integer;
begin
  if not public.is_service_role() then
    raise exception 'forbidden: service_role only';
  end if;

  if p_user_id is null or p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_arguments');
  end if;

  insert into public.user_credit_wallet (user_id) values (p_user_id)
  on conflict (user_id) do nothing;

  if exists (select 1 from public.user_credit_ledger where idempotency_key = p_idempotency_key) then
    select current_balance into v_bal from public.user_credit_wallet where user_id = p_user_id;
    return jsonb_build_object('ok', true, 'already_granted', true, 'current_balance', coalesce(v_bal, 0));
  end if;

  select current_balance into v_bal from public.user_credit_wallet where user_id = p_user_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'wallet_missing');
  end if;

  v_bal := v_bal + 1;

  insert into public.user_credit_ledger (
    user_id, entry_type, entry_reason, credit_delta, balance_after,
    idempotency_key, metadata, related_period_start, related_period_end
  ) values (
    p_user_id, 'grant', 'monthly_credit_grant', 1, v_bal,
    p_idempotency_key,
    jsonb_build_object('source', 'billing_cycle'),
    p_period_start, p_period_end
  );

  update public.user_credit_wallet set
    current_balance = v_bal,
    lifetime_credits_granted = lifetime_credits_granted + 1,
    monthly_included_credits_granted = monthly_included_credits_granted + 1,
    updated_at = now()
  where user_id = p_user_id;

  return jsonb_build_object('ok', true, 'current_balance', v_bal);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) consume_import_credit — authenticated user only; auth.uid() must match p_user_id
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 4) grant_purchased_credits — service_role only, idempotent
-- ---------------------------------------------------------------------------
create or replace function public.grant_purchased_credits(
  p_user_id uuid,
  p_quantity integer,
  p_purchase_event_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bal integer;
begin
  if not public.is_service_role() then
    raise exception 'forbidden: service_role only';
  end if;

  if p_user_id is null or p_quantity is null or p_quantity < 1 or p_idempotency_key is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_arguments');
  end if;

  insert into public.user_credit_wallet (user_id) values (p_user_id)
  on conflict (user_id) do nothing;

  if exists (select 1 from public.user_credit_ledger where idempotency_key = p_idempotency_key) then
    select current_balance into v_bal from public.user_credit_wallet where user_id = p_user_id;
    return jsonb_build_object('ok', true, 'already_granted', true, 'current_balance', coalesce(v_bal, 0));
  end if;

  select current_balance into v_bal from public.user_credit_wallet where user_id = p_user_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'wallet_missing');
  end if;

  v_bal := v_bal + p_quantity;

  insert into public.user_credit_ledger (
    user_id, entry_type, entry_reason, credit_delta, balance_after,
    related_purchase_event_id, idempotency_key, metadata
  ) values (
    p_user_id, 'grant', 'consumable_purchase_grant', p_quantity, v_bal,
    p_purchase_event_id, p_idempotency_key,
    jsonb_build_object('quantity', p_quantity, 'purchase_event_id', p_purchase_event_id)
  );

  update public.user_credit_wallet set
    current_balance = v_bal,
    lifetime_credits_granted = lifetime_credits_granted + p_quantity,
    purchased_credits_granted = purchased_credits_granted + p_quantity,
    updated_at = now()
  where user_id = p_user_id;

  return jsonb_build_object('ok', true, 'current_balance', v_bal);
end;
$$;

-- ---------------------------------------------------------------------------
-- 5) get_user_credit_state — self or service_role
-- ---------------------------------------------------------------------------
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
    'has_app_access_hint', coalesce(v_sub.entitlement_active, false)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants (lock down)
-- ---------------------------------------------------------------------------
revoke all on function public.grant_signup_credits(uuid) from public;
revoke all on function public.grant_monthly_included_credit(uuid, timestamptz, timestamptz, text) from public;
revoke all on function public.grant_purchased_credits(uuid, integer, uuid, text) from public;
revoke all on function public.consume_import_credit(uuid, uuid, text) from public;
revoke all on function public.get_user_credit_state(uuid) from public;
revoke all on function public.is_service_role() from public;

grant execute on function public.consume_import_credit(uuid, uuid, text) to authenticated;
grant execute on function public.get_user_credit_state(uuid) to authenticated;
grant execute on function public.get_user_credit_state(uuid) to service_role;

grant execute on function public.grant_monthly_included_credit(uuid, timestamptz, timestamptz, text) to service_role;
grant execute on function public.grant_purchased_credits(uuid, integer, uuid, text) to service_role;

-- grant_signup_credits: invoked only from trigger (same owner); explicit grant for postgres/supabase_admin if needed
grant execute on function public.grant_signup_credits(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- handle_new_user — grant signup credits after profile + usage_limits
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  insert into public.usage_limits (user_id) values (new.id)
  on conflict (user_id) do nothing;
  perform public.grant_signup_credits(new.id);
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Backfill: wallet rows for existing users (no automatic signup credits — product may run one-off SQL)
-- ---------------------------------------------------------------------------
insert into public.user_credit_wallet (user_id)
select u.id from auth.users u
where not exists (select 1 from public.user_credit_wallet w where w.user_id = u.id)
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Backfill user_subscription_status from legacy subscription_status if table + columns match
-- (Skip when remote subscription_status is an older/template shape without `status`.)
-- ---------------------------------------------------------------------------
do $subscription_backfill$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'subscription_status'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'subscription_status' and column_name = 'user_id'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'subscription_status' and column_name = 'status'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'subscription_status' and column_name = 'expires_at'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'subscription_status' and column_name = 'updated_at'
  ) then
    insert into public.user_subscription_status (
      user_id,
      entitlement_active,
      expires_at,
      last_webhook_event_at,
      created_at,
      updated_at,
      entitlement_source
    )
    select
      s.user_id,
      case when s.status in ('active', 'grace_period') then true else false end,
      s.expires_at,
      s.updated_at,
      coalesce(s.updated_at, now()),
      coalesce(s.updated_at, now()),
      'revenuecat_legacy'
    from public.subscription_status s
    on conflict (user_id) do nothing;
  end if;
end;
$subscription_backfill$;

comment on function public.consume_import_credit is
  'Atomically consumes one credit for an import. Idempotent per idempotency_key. Caller must be the user JWT.';

comment on function public.grant_purchased_credits is
  'service_role only. Idempotent credit grant from consumable IAP; link optional app_purchase_events row.';

comment on function public.get_user_credit_state is
  'Returns wallet JSON + subscription JSON + has_app_access_hint (entitlement_active).';
