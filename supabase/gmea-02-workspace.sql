begin;
create table if not exists public.gmea_projects (
 id uuid primary key default gen_random_uuid(), name text not null, client text not null default '',
 location text not null, description text not null default '', start_date date, end_date date,
 duration text not null default '', status text not null default 'planning'
 check(status in ('planning','active','on_hold','completed','archived')), version integer not null default 1,
 created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(end_date is null or start_date is null or end_date>=start_date)
);
create table if not exists public.gmea_quotations (
 id uuid primary key, project_id uuid not null references public.gmea_projects(id) on delete cascade,
 status text not null default 'draft' check(status in ('draft','accepted','superseded')),
 total numeric(16,2) not null check(total>=0), data jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists gmea_one_accepted on public.gmea_quotations(project_id) where status='accepted';
create table if not exists public.gmea_quotation_items (
 id uuid primary key default gen_random_uuid(), quotation_id uuid not null references public.gmea_quotations(id) on delete cascade,
 sort_order integer not null, description text not null, unit text not null,
 quantity numeric(16,4) not null check(quantity>0), unit_price numeric(16,2) not null check(unit_price>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
do $$
declare table_name text;
begin
 foreach table_name in array array['gmea_milestones','gmea_receipts','gmea_expenses','gmea_partners'] loop
  execute format('create table if not exists public.%I (
   id uuid primary key, project_id uuid not null references public.gmea_projects(id) on delete cascade,
   data jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now())',table_name);
  execute format('create index if not exists %I on public.%I(project_id)',table_name||'_project_idx',table_name);
 end loop;
end $$;
create index if not exists gmea_quotes_project_idx on public.gmea_quotations(project_id);
create index if not exists gmea_items_quote_idx on public.gmea_quotation_items(quotation_id);
create or replace function public.can_read_gmea()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and is_active and role::text in ('gmea','ceo')) $$;
do $$
declare table_name text;
begin
 foreach table_name in array array['gmea_projects','gmea_quotations','gmea_quotation_items','gmea_milestones','gmea_receipts','gmea_expenses','gmea_partners'] loop
  execute format('alter table public.%I enable row level security',table_name);
  execute format('revoke all on public.%I from anon, authenticated',table_name);
  execute format('grant select on public.%I to authenticated',table_name);
  execute format('grant all on public.%I to service_role',table_name);
  execute format('drop policy if exists gmea_read on public.%I',table_name);
  execute format('create policy gmea_read on public.%I for select to authenticated using(public.can_read_gmea())',table_name);
 end loop;
end $$;
commit;

