begin;

create table if not exists public.gmea_projects (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 client text not null default '',
 location text not null,
 contract_amount numeric(16,2) not null default 0,
 withholding_tax_rate numeric(7,4) not null default 0,
 duration text not null,
 status text not null default 'planning'
  check(status in ('planning','active','on_hold','completed','archived')),
 version integer not null default 1,
 created_by uuid references public.profiles(id) on delete set null,
 updated_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint gmea_contract_amount_nonnegative check(contract_amount >= 0)
);

alter table public.gmea_projects
 add column if not exists contract_amount numeric(16,2),
 add column if not exists withholding_tax_rate numeric(7,4);

-- Preserve the current accepted quotation value when upgrading the old GMEA model.
do $$
begin
 if to_regclass('public.gmea_quotations') is not null then
  execute 'update public.gmea_projects p
   set contract_amount=q.total
   from public.gmea_quotations q
   where q.project_id=p.id and q.status=''accepted''
    and p.contract_amount is null';
 end if;
end $$;

update public.gmea_projects set contract_amount=0 where contract_amount is null;

-- Preserve withholding already recorded by the removed payment model.
do $$
begin
 if to_regclass('public.gmea_receipts') is not null then
  execute 'update public.gmea_projects p
   set withholding_tax_rate=case
    when p.contract_amount>0 then round((receipts.withholding/p.contract_amount)*100,4)
    else 0
   end
   from (
    select project_id,sum(coalesce((data->>''withholding'')::numeric,0)) withholding
    from public.gmea_receipts group by project_id
   ) receipts
   where receipts.project_id=p.id and p.withholding_tax_rate is null';
 end if;
end $$;

update public.gmea_projects
set withholding_tax_rate=0
where withholding_tax_rate is null;
alter table public.gmea_projects
 alter column contract_amount set default 0,
 alter column contract_amount set not null,
 alter column withholding_tax_rate set default 0,
 alter column withholding_tax_rate set not null,
 drop column if exists description,
 drop column if exists start_date,
 drop column if exists end_date;

do $$
begin
 if not exists(
  select 1 from pg_constraint
  where conname='gmea_contract_amount_nonnegative'
   and conrelid='public.gmea_projects'::regclass
 ) then
 alter table public.gmea_projects
   add constraint gmea_contract_amount_nonnegative check(contract_amount >= 0);
 end if;
 if not exists(
  select 1 from pg_constraint
  where conname='gmea_withholding_tax_rate_range'
   and conrelid='public.gmea_projects'::regclass
 ) then
  alter table public.gmea_projects
   add constraint gmea_withholding_tax_rate_range
   check(withholding_tax_rate between 0 and 100);
 end if;
end $$;

-- Quotations and collections are no longer part of project monitoring.
drop table if exists public.gmea_quotation_items cascade;
drop table if exists public.gmea_quotations cascade;
drop table if exists public.gmea_milestones cascade;
drop table if exists public.gmea_receipts cascade;

create table if not exists public.gmea_expenses (
 id uuid primary key,
 project_id uuid not null references public.gmea_projects(id) on delete cascade,
 data jsonb not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.gmea_partners (
 id uuid primary key,
 project_id uuid not null references public.gmea_projects(id) on delete cascade,
 data jsonb not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.gmea_expense_options (
 id uuid primary key default gen_random_uuid(),
 field text not null check(field in ('supplier','method','invoice_name')),
 value text not null check(length(btrim(value)) between 1 and 200),
 created_at timestamptz not null default now()
);

create index if not exists gmea_expenses_project_idx
 on public.gmea_expenses(project_id);
create index if not exists gmea_partners_project_idx
 on public.gmea_partners(project_id);
create unique index if not exists gmea_expense_options_unique
 on public.gmea_expense_options(field,lower(value));

insert into public.gmea_expense_options(field,value)
select option_field,btrim(option_value)
from public.gmea_expenses expense
cross join lateral (values
 ('supplier',expense.data->>'supplier'),
 ('method',expense.data->>'method'),
 ('invoice_name',expense.data->>'invoice_name')
) as options(option_field,option_value)
where btrim(coalesce(option_value,''))<>''
on conflict do nothing;

insert into public.gmea_expense_options(field,value) values
 ('method','Cash'),
 ('method','Cheque'),
 ('method','Bank transfer'),
 ('method','GCash'),
 ('method','Online transfer'),
 ('invoice_name','GMEA MARKETING CORP.'),
 ('invoice_name','Prodisenyo Builders Corp.')
on conflict do nothing;

create or replace function public.can_read_gmea()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(
 select 1 from public.profiles
 where id=auth.uid() and is_active and role::text in ('gmea','ceo')
) $$;

do $$
declare table_name text;
begin
 foreach table_name in array array[
  'gmea_projects','gmea_expenses','gmea_partners','gmea_expense_options'
 ] loop
  execute format('alter table public.%I enable row level security',table_name);
  execute format('revoke all on public.%I from anon, authenticated',table_name);
  execute format('grant select on public.%I to authenticated',table_name);
  execute format('grant all on public.%I to service_role',table_name);
  execute format('drop policy if exists gmea_read on public.%I',table_name);
  execute format(
   'create policy gmea_read on public.%I for select to authenticated using(public.can_read_gmea())',
   table_name
  );
 end loop;
end $$;

commit;
