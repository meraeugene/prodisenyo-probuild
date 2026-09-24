-- Independent foundation for the GMEA Rentals module.
-- This migration does not alter or reference existing GMEA Projects data.
begin;

create table if not exists public.gmea_rental_equipment (
  id uuid primary key default gen_random_uuid(),
  code text not null check(length(btrim(code)) between 1 and 100),
  name text not null check(length(btrim(name)) between 1 and 200),
  description text not null default '',
  serial_number text not null default '',
  default_rate numeric(16,2) not null default 0 check(default_rate >= 0),
  rate_unit text not null default 'day'
    check(rate_unit in ('hour','day','week','month','fixed')),
  status text not null default 'available'
    check(status in ('available','rented','maintenance','inactive')),
  version integer not null default 1 check(version >= 1),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists gmea_rental_equipment_code_unique
  on public.gmea_rental_equipment(lower(code));
create index if not exists gmea_rental_equipment_status_idx
  on public.gmea_rental_equipment(status,name);

create table if not exists public.gmea_rentals (
  id uuid primary key default gen_random_uuid(),
  rental_number text not null
    check(length(btrim(rental_number)) between 1 and 100),
  customer_name text not null
    check(length(btrim(customer_name)) between 1 and 200),
  customer_contact text not null default '',
  customer_address text not null default '',
  site_location text not null default '',
  start_date date not null,
  expected_return_date date,
  actual_return_date date,
  status text not null default 'draft'
    check(status in ('draft','active','completed','cancelled')),
  notes text not null default '',
  version integer not null default 1 check(version >= 1),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gmea_rental_expected_return_valid check(
    expected_return_date is null or expected_return_date >= start_date
  ),
  constraint gmea_rental_actual_return_valid check(
    actual_return_date is null or actual_return_date >= start_date
  )
);

create unique index if not exists gmea_rentals_number_unique
  on public.gmea_rentals(lower(rental_number));
create index if not exists gmea_rentals_status_dates_idx
  on public.gmea_rentals(status,start_date,expected_return_date);

create table if not exists public.gmea_rental_items (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references public.gmea_rentals(id) on delete cascade,
  equipment_id uuid not null
    references public.gmea_rental_equipment(id) on delete restrict,
  equipment_name text not null
    check(length(btrim(equipment_name)) between 1 and 200),
  quantity numeric(12,2) not null default 1 check(quantity > 0),
  rate numeric(16,2) not null default 0 check(rate >= 0),
  rate_unit text not null default 'day'
    check(rate_unit in ('hour','day','week','month','fixed')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gmea_rental_items_rental_idx
  on public.gmea_rental_items(rental_id,created_at);
create index if not exists gmea_rental_items_equipment_idx
  on public.gmea_rental_items(equipment_id,rental_id);

create table if not exists public.gmea_rental_workers (
  id uuid primary key default gen_random_uuid(),
  worker_code text,
  full_name text not null check(length(btrim(full_name)) between 1 and 200),
  role_name text not null default '',
  contact_number text not null default '',
  default_rate numeric(16,2) not null default 0 check(default_rate >= 0),
  status text not null default 'active'
    check(status in ('active','inactive')),
  version integer not null default 1 check(version >= 1),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gmea_rental_worker_code_valid check(
    worker_code is null or length(btrim(worker_code)) between 1 and 100
  )
);

create unique index if not exists gmea_rental_workers_code_unique
  on public.gmea_rental_workers(lower(worker_code))
  where worker_code is not null;
create index if not exists gmea_rental_workers_status_name_idx
  on public.gmea_rental_workers(status,full_name);

create table if not exists public.gmea_rental_worker_assignments (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references public.gmea_rentals(id) on delete cascade,
  worker_id uuid not null
    references public.gmea_rental_workers(id) on delete restrict,
  assigned_from date not null,
  assigned_until date,
  rate numeric(16,2) not null default 0 check(rate >= 0),
  status text not null default 'assigned'
    check(status in ('assigned','completed','cancelled')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gmea_rental_worker_assignment_dates_valid check(
    assigned_until is null or assigned_until >= assigned_from
  )
);

create index if not exists gmea_rental_worker_assignments_rental_idx
  on public.gmea_rental_worker_assignments(rental_id,assigned_from);
create index if not exists gmea_rental_worker_assignments_worker_idx
  on public.gmea_rental_worker_assignments(worker_id,status);

create table if not exists public.gmea_rental_payments (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references public.gmea_rentals(id) on delete cascade,
  amount numeric(16,2) not null check(amount > 0),
  payment_date date not null,
  method text not null default '',
  reference_number text not null default '',
  notes text not null default '',
  status text not null default 'posted'
    check(status in ('posted','voided')),
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  voided_by uuid references public.profiles(id) on delete restrict,
  voided_at timestamptz,
  void_reason text not null default '',
  constraint gmea_rental_payment_void_audit check(
    (status='posted' and voided_by is null and voided_at is null and void_reason='')
    or
    (status='voided' and voided_by is not null and voided_at is not null
      and length(btrim(void_reason)) > 0)
  )
);

create index if not exists gmea_rental_payments_rental_idx
  on public.gmea_rental_payments(rental_id,payment_date,recorded_at);

create table if not exists public.gmea_rental_expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(btrim(name)) between 1 and 100),
  is_active boolean not null default true,
  sort_order integer not null default 0 check(sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists gmea_rental_expense_categories_name_unique
  on public.gmea_rental_expense_categories(lower(name));

create table if not exists public.gmea_rental_expenses (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid references public.gmea_rentals(id) on delete cascade,
  equipment_id uuid
    references public.gmea_rental_equipment(id) on delete restrict,
  category_id uuid not null
    references public.gmea_rental_expense_categories(id) on delete restrict,
  expense_date date not null,
  description text not null
    check(length(btrim(description)) between 1 and 1000),
  supplier text not null default '',
  invoice_number text not null default '',
  amount numeric(16,2) not null check(amount > 0),
  refunded_amount numeric(16,2) not null default 0
    check(refunded_amount >= 0),
  vat_mode text not null default 'off'
    check(vat_mode in ('off','inclusive','exclusive')),
  vat_rate numeric(5,2) not null default 0
    check(vat_rate between 0 and 100),
  method text not null default '',
  notes text not null default '',
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gmea_rental_expense_vat_valid check(
    (vat_mode='off' and vat_rate=0)
    or (vat_mode in ('inclusive','exclusive') and vat_rate > 0)
  )
);

create index if not exists gmea_rental_expenses_rental_idx
  on public.gmea_rental_expenses(rental_id,expense_date,created_at);
create index if not exists gmea_rental_expenses_equipment_idx
  on public.gmea_rental_expenses(equipment_id,expense_date);
create index if not exists gmea_rental_expenses_category_idx
  on public.gmea_rental_expenses(category_id,expense_date);

create table if not exists public.gmea_rental_expense_notifications (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null
    references public.gmea_rental_expenses(id) on delete cascade,
  rental_id uuid references public.gmea_rentals(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique(expense_id,recipient_id)
);

comment on table public.gmea_rental_expense_notifications is
  'Per-CEO read state for future GMEA Rentals expense notifications.';

create index if not exists gmea_rental_expense_notifications_recipient_idx
  on public.gmea_rental_expense_notifications(
    recipient_id,read_at,created_at desc
  );

create or replace function public.can_read_gmea_rentals()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1
    from public.profiles
    where id=auth.uid()
      and is_active
      and role::text in ('gmea','ceo')
  )
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'gmea_rental_equipment',
    'gmea_rentals',
    'gmea_rental_items',
    'gmea_rental_workers',
    'gmea_rental_worker_assignments',
    'gmea_rental_payments',
    'gmea_rental_expense_categories',
    'gmea_rental_expenses'
  ] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('revoke all on public.%I from anon,authenticated',table_name);
    execute format('grant select on public.%I to authenticated',table_name);
    execute format('grant all on public.%I to service_role',table_name);

    if not exists(
      select 1 from pg_policies
      where schemaname='public'
        and tablename=table_name
        and policyname='gmea_rentals_read'
    ) then
      execute format(
        'create policy gmea_rentals_read on public.%I for select to authenticated using(public.can_read_gmea_rentals())',
        table_name
      );
    end if;
  end loop;
end $$;

alter table public.gmea_rental_expense_notifications enable row level security;
revoke all on public.gmea_rental_expense_notifications from anon,authenticated;
grant select on public.gmea_rental_expense_notifications to authenticated;
grant all on public.gmea_rental_expense_notifications to service_role;

do $$
begin
  if not exists(
    select 1 from pg_policies
    where schemaname='public'
      and tablename='gmea_rental_expense_notifications'
      and policyname='gmea_rental_expense_notification_read'
  ) then
    create policy gmea_rental_expense_notification_read
      on public.gmea_rental_expense_notifications
      for select to authenticated
      using(
        recipient_id=auth.uid()
        and exists(
          select 1 from public.profiles
          where id=auth.uid() and is_active and role::text='ceo'
        )
      );
  end if;
end $$;

commit;
