begin;

create table if not exists public.gmea_projects (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 client text not null default '',
 location text not null,
 contract_amount numeric(16,2) not null default 0,
 duration text not null,
 version integer not null default 1,
 created_by uuid references public.profiles(id) on delete set null,
 updated_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint gmea_contract_amount_nonnegative check(contract_amount >= 0)
);

alter table public.gmea_projects
 add column if not exists contract_amount numeric(16,2);

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

alter table public.gmea_projects
 alter column contract_amount set default 0,
 alter column contract_amount set not null,
 drop column if exists withholding_tax_rate,
 drop column if exists status,
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
end $$;

-- Quotations and the legacy payment model are no longer used.
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

create table if not exists public.gmea_collections (
 id uuid primary key,
 project_id uuid not null references public.gmea_projects(id) on delete cascade,
 data jsonb not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.gmea_expense_notifications (
 id uuid primary key default gen_random_uuid(),
 expense_id uuid not null references public.gmea_expenses(id) on delete cascade,
 project_id uuid not null references public.gmea_projects(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 read_at timestamptz,
 created_at timestamptz not null default now(),
 unique(expense_id,recipient_id)
);

-- Keep collection rows as description, amount, and notes only. When upgrading
-- the earlier detailed form, preserve its black-cell details inside notes.
update public.gmea_collections
set data=jsonb_build_object(
 'description',coalesce(data->>'description',''),
 'amount',coalesce(data->'amount','0'::jsonb),
 'sort_order',coalesce(data->'sort_order','0'::jsonb),
 'notes',coalesce(
  nullif(btrim(data->>'notes'),''),
  concat_ws(' · ',
   nullif(initcap(data->>'status'),''),
   nullif(btrim(data->>'method'),''),
   nullif(btrim(data->>'reference_number'),''),
   nullif(btrim(data->>'date'),''),
   nullif(initcap(replace(data->>'deposit_status','_',' ')),'')
  )
 )
);

update public.gmea_expenses
set data=(data-'notes') || jsonb_build_object(
 'refunded_amount',coalesce((data->>'refunded_amount')::numeric,0),
 'vat_rate',case when coalesce(data->>'vat_mode','off')='off' then 0 else 12 end
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
create index if not exists gmea_collections_project_idx
 on public.gmea_collections(project_id);
create index if not exists gmea_expense_notifications_recipient_idx
 on public.gmea_expense_notifications(recipient_id,read_at,created_at desc);
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
  'gmea_projects','gmea_expenses','gmea_collections','gmea_partners','gmea_expense_options'
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

alter table public.gmea_expense_notifications enable row level security;
revoke all on public.gmea_expense_notifications from anon,authenticated;
grant select on public.gmea_expense_notifications to authenticated;
grant all on public.gmea_expense_notifications to service_role;
drop policy if exists gmea_expense_notification_read on public.gmea_expense_notifications;
create policy gmea_expense_notification_read
 on public.gmea_expense_notifications for select to authenticated
 using(
  recipient_id=auth.uid() and exists(
   select 1 from public.profiles
   where id=auth.uid() and is_active and role::text='ceo'
  )
 );

commit;
