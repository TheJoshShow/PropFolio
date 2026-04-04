-- PropFolio backend hardening: canonical naming, snapshot history, scenarios, subscription mirror, usage RPC.

-- ---------------------------------------------------------------------------
-- 1) Rename import_logs → property_imports (keep RLS policies attached)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'import_logs'
  ) and not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'property_imports'
  ) then
    alter table public.import_logs rename to property_imports;
  end if;
end $$;

alter table public.property_imports add column if not exists error_code text;
alter table public.property_imports add column if not exists duration_ms integer;

-- Rename legacy policies for clarity (optional; safe if names differ)
drop policy if exists "import_logs_select_own" on public.property_imports;
drop policy if exists "import_logs_insert_own" on public.property_imports;
drop policy if exists "property_imports_select_own" on public.property_imports;
drop policy if exists "property_imports_insert_own" on public.property_imports;

create policy "property_imports_select_own"
  on public.property_imports for select
  using (auth.uid() = user_id);

create policy "property_imports_insert_own"
  on public.property_imports for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2) property_snapshots — versioned snapshot rows (current row still on properties.snapshot)
-- ---------------------------------------------------------------------------
create table if not exists public.property_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  schema_version text not null default '1',
  snapshot jsonb not null,
  source text not null default 'import' check (source in ('import', 'user_edit', 'provider_refresh', 'system')),
  correlation_id text,
  created_at timestamptz not null default now()
);

create index if not exists property_snapshots_property_created_idx
  on public.property_snapshots (property_id, created_at desc);
create index if not exists property_snapshots_user_idx
  on public.property_snapshots (user_id, created_at desc);

alter table public.property_snapshots enable row level security;

drop policy if exists "property_snapshots_select_own" on public.property_snapshots;
create policy "property_snapshots_select_own"
  on public.property_snapshots for select
  using (auth.uid() = user_id);

drop policy if exists "property_snapshots_insert_own" on public.property_snapshots;
create policy "property_snapshots_insert_own"
  on public.property_snapshots for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3) scenarios — saved assumption / what-if patches per property
-- ---------------------------------------------------------------------------
create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  label text not null,
  patch jsonb not null default '{}'::jsonb,
  assumptions jsonb,
  is_saved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scenarios_property_idx on public.scenarios (property_id, updated_at desc);

alter table public.scenarios enable row level security;

drop policy if exists "scenarios_select_own" on public.scenarios;
create policy "scenarios_select_own"
  on public.scenarios for select
  using (auth.uid() = user_id);

drop policy if exists "scenarios_insert_own" on public.scenarios;
create policy "scenarios_insert_own"
  on public.scenarios for insert
  with check (auth.uid() = user_id);

drop policy if exists "scenarios_update_own" on public.scenarios;
create policy "scenarios_update_own"
  on public.scenarios for update
  using (auth.uid() = user_id);

drop policy if exists "scenarios_delete_own" on public.scenarios;
create policy "scenarios_delete_own"
  on public.scenarios for delete
  using (auth.uid() = user_id);

create or replace function public.set_scenarios_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists scenarios_set_updated_at on public.scenarios;
create trigger scenarios_set_updated_at
  before update on public.scenarios
  for each row execute function public.set_scenarios_updated_at();

-- ---------------------------------------------------------------------------
-- 4) subscription_status — mirror of RevenueCat (webhook / server only writes via service role)
-- ---------------------------------------------------------------------------
create table if not exists public.subscription_status (
  user_id uuid primary key references auth.users (id) on delete cascade,
  revenuecat_app_user_id text,
  status text not null default 'unknown',
  entitlements jsonb not null default '[]'::jsonb,
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  last_event jsonb
);

alter table public.subscription_status enable row level security;

-- Clients read their own row only; writes come from Edge (service role) and bypass RLS.
drop policy if exists "subscription_status_select_own" on public.subscription_status;
create policy "subscription_status_select_own"
  on public.subscription_status for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5) usage_limits — server-side import counter (authoritative vs device cache)
-- ---------------------------------------------------------------------------
create table if not exists public.usage_limits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  property_imports_total int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.usage_limits enable row level security;

drop policy if exists "usage_limits_select_own" on public.usage_limits;
create policy "usage_limits_select_own"
  on public.usage_limits for select
  using (auth.uid() = user_id);

-- No direct client updates — use RPC below.

create or replace function public.increment_property_import_usage()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  insert into public.usage_limits (user_id, property_imports_total)
  values (auth.uid(), 1)
  on conflict (user_id) do update set
    property_imports_total = public.usage_limits.property_imports_total + 1,
    updated_at = now();
end;
$$;

grant execute on function public.increment_property_import_usage() to authenticated;

-- ---------------------------------------------------------------------------
-- 6) profiles — optional prefs column
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists notification_prefs jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 7) New users get usage_limits row
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
  return new;
end;
$$;
