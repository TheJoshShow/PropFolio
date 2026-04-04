-- Properties + import audit trail (RLS). Snapshot JSON feeds portfolio, detail, and scoring.
-- Idempotent for remotes with an older `properties` / `import_logs` shape (missing columns).

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_type text not null check (source_type in ('zillow_url', 'redfin_url', 'manual_address')),
  source_url text,
  raw_input text,
  status text not null default 'draft' check (status in ('draft', 'ready', 'error')),
  missing_fields jsonb not null default '[]'::jsonb,
  snapshot jsonb not null default '{}'::jsonb,
  place_id text,
  formatted_address text,
  latitude double precision,
  longitude double precision,
  confidence_score double precision,
  last_import_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Align with app schema if table pre-existed (e.g. template / manual DDL)
alter table public.properties add column if not exists user_id uuid;
alter table public.properties add column if not exists source_type text;
alter table public.properties add column if not exists source_url text;
alter table public.properties add column if not exists raw_input text;
alter table public.properties add column if not exists status text;
alter table public.properties add column if not exists missing_fields jsonb;
alter table public.properties add column if not exists snapshot jsonb;
alter table public.properties add column if not exists place_id text;
alter table public.properties add column if not exists formatted_address text;
alter table public.properties add column if not exists latitude double precision;
alter table public.properties add column if not exists longitude double precision;
alter table public.properties add column if not exists confidence_score double precision;
alter table public.properties add column if not exists last_import_error text;
alter table public.properties add column if not exists created_at timestamptz;
alter table public.properties add column if not exists updated_at timestamptz;

-- FK user_id → auth.users (skip if constraint already present)
do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public' and t.relname = 'properties'
      and c.contype = 'f' and c.conname = 'properties_user_id_fkey'
  ) then
    alter table public.properties
      add constraint properties_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
exception
  when duplicate_object then null;
end $$;

-- Defaults & data cleanup before NOT NULL / check constraints
alter table public.properties alter column status set default 'draft';
alter table public.properties alter column missing_fields set default '[]'::jsonb;
alter table public.properties alter column snapshot set default '{}'::jsonb;
alter table public.properties alter column created_at set default now();
alter table public.properties alter column updated_at set default now();

update public.properties set missing_fields = '[]'::jsonb where missing_fields is null;
update public.properties set snapshot = '{}'::jsonb where snapshot is null;
update public.properties set status = 'draft' where status is null;
update public.properties set source_type = 'manual_address' where source_type is null;
update public.properties set created_at = now() where created_at is null;
update public.properties set updated_at = now() where updated_at is null;

-- Rows with no owner cannot satisfy RLS; remove (usually zero rows on empty dev DB)
delete from public.properties where user_id is null;

alter table public.properties alter column user_id set not null;
alter table public.properties alter column source_type set not null;
alter table public.properties alter column status set not null;
alter table public.properties alter column missing_fields set not null;
alter table public.properties alter column snapshot set not null;
alter table public.properties alter column created_at set not null;
alter table public.properties alter column updated_at set not null;

alter table public.properties drop constraint if exists properties_source_type_check;
alter table public.properties add constraint properties_source_type_check
  check (source_type in ('zillow_url', 'redfin_url', 'manual_address'));

alter table public.properties drop constraint if exists properties_status_check;
alter table public.properties add constraint properties_status_check
  check (status in ('draft', 'ready', 'error'));

create index if not exists properties_user_id_idx on public.properties (user_id);
create index if not exists properties_created_at_idx on public.properties (user_id, created_at desc);

alter table public.properties enable row level security;

drop policy if exists "properties_select_own" on public.properties;
create policy "properties_select_own"
  on public.properties for select
  using (auth.uid() = user_id);

drop policy if exists "properties_insert_own" on public.properties;
create policy "properties_insert_own"
  on public.properties for insert
  with check (auth.uid() = user_id);

drop policy if exists "properties_update_own" on public.properties;
create policy "properties_update_own"
  on public.properties for update
  using (auth.uid() = user_id);

drop policy if exists "properties_delete_own" on public.properties;
create policy "properties_delete_own"
  on public.properties for delete
  using (auth.uid() = user_id);

create or replace function public.set_properties_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_properties_updated_at();

-- Structured import / pipeline logs (003 renames this to property_imports)
create table if not exists public.import_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  correlation_id text,
  source_type text,
  step text not null,
  status text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.import_logs add column if not exists user_id uuid;
alter table public.import_logs add column if not exists property_id uuid;
alter table public.import_logs add column if not exists correlation_id text;
alter table public.import_logs add column if not exists source_type text;
alter table public.import_logs add column if not exists step text;
alter table public.import_logs add column if not exists status text;
alter table public.import_logs add column if not exists payload jsonb;
alter table public.import_logs add column if not exists created_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public' and t.relname = 'import_logs'
      and c.contype = 'f' and c.conname = 'import_logs_user_id_fkey'
  ) then
    alter table public.import_logs
      add constraint import_logs_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public' and t.relname = 'import_logs'
      and c.contype = 'f' and c.conname = 'import_logs_property_id_fkey'
  ) then
    alter table public.import_logs
      add constraint import_logs_property_id_fkey
      foreign key (property_id) references public.properties (id) on delete set null;
  end if;
exception
  when duplicate_object then null;
end $$;

alter table public.import_logs alter column payload set default '{}'::jsonb;
alter table public.import_logs alter column created_at set default now();

update public.import_logs set payload = '{}'::jsonb where payload is null;
update public.import_logs set step = 'unknown' where step is null;
update public.import_logs set status = 'unknown' where status is null;
update public.import_logs set created_at = now() where created_at is null;

delete from public.import_logs where user_id is null;

alter table public.import_logs alter column step set not null;
alter table public.import_logs alter column status set not null;
alter table public.import_logs alter column payload set not null;
alter table public.import_logs alter column created_at set not null;
alter table public.import_logs alter column user_id set not null;

create index if not exists import_logs_user_idx on public.import_logs (user_id, created_at desc);
create index if not exists import_logs_correlation_idx on public.import_logs (correlation_id);

alter table public.import_logs enable row level security;

drop policy if exists "import_logs_select_own" on public.import_logs;
create policy "import_logs_select_own"
  on public.import_logs for select
  using (auth.uid() = user_id);

drop policy if exists "import_logs_insert_own" on public.import_logs;
create policy "import_logs_insert_own"
  on public.import_logs for insert
  with check (auth.uid() = user_id);
