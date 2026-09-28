-- Historical Rentals import support. Apply separately before a reviewed import.
-- This migration does not import workbook data or alter GMEA Projects.
begin;

create table if not exists public.gmea_rental_historical_income (
  id uuid primary key,
  income_month date not null unique
    check(extract(day from income_month)=1),
  amount numeric(16,2) not null check(amount>0),
  source_sheet text not null,
  source_cell text not null,
  source_fingerprint text not null unique
    check(source_fingerprint ~ '^[0-9a-f]{64}$'),
  notes text not null default '',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.gmea_rental_history_import_ledger (
  id uuid primary key default gen_random_uuid(),
  source_locator text not null unique,
  source_fingerprint text not null unique
    check(source_fingerprint ~ '^[0-9a-f]{64}$'),
  record_kind text not null
    check(record_kind in ('equipment','expense','income')),
  target_id uuid not null,
  source_payload jsonb not null,
  imported_by uuid not null references public.profiles(id) on delete restrict,
  imported_at timestamptz not null default now()
);

alter table public.gmea_rental_historical_income enable row level security;
alter table public.gmea_rental_history_import_ledger enable row level security;
revoke all on public.gmea_rental_historical_income from anon,authenticated;
revoke all on public.gmea_rental_history_import_ledger from anon,authenticated;
grant select on public.gmea_rental_historical_income to authenticated;
grant select on public.gmea_rental_history_import_ledger to authenticated;
grant all on public.gmea_rental_historical_income to service_role;
grant all on public.gmea_rental_history_import_ledger to service_role;

do $$
begin
  if not exists(
    select 1 from pg_policies
    where schemaname='public'
      and tablename='gmea_rental_historical_income'
      and policyname='gmea_rentals_read'
  ) then
    create policy gmea_rentals_read
      on public.gmea_rental_historical_income
      for select to authenticated
      using(public.can_read_gmea_rentals());
  end if;
  if not exists(
    select 1 from pg_policies
    where schemaname='public'
      and tablename='gmea_rental_history_import_ledger'
      and policyname='gmea_rentals_read'
  ) then
    create policy gmea_rentals_read
      on public.gmea_rental_history_import_ledger
      for select to authenticated
      using(public.can_read_gmea_rentals());
  end if;
end $$;

commit;

begin;

create or replace function public.import_gmea_rental_history_record(
  p_actor uuid,
  p_record jsonb
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  kind text:=p_record->>'kind';
  locator text:=coalesce(
    p_record->>'sourceLocator',
    p_record->>'source_locator'
  );
  fingerprint text:=coalesce(
    p_record->>'sourceFingerprint',
    p_record->>'source_fingerprint'
  );
  prior public.gmea_rental_history_import_ledger;
  target uuid;
  target_code text;
  target_name text;
  target_category uuid;
  target_equipment uuid;
  target_month date;
  target_amount numeric(16,2);
begin
  if not exists(
    select 1 from public.profiles
    where id=p_actor and role::text='gmea' and is_active
  ) then
    raise exception 'Only an active GMEA user can import rental history';
  end if;
  if kind not in ('equipment','expense','income')
    or length(coalesce(locator,''))<1
    or fingerprint !~ '^[0-9a-f]{64}$'
  then
    raise exception 'Invalid historical import record';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(locator,0));
  select * into prior
  from public.gmea_rental_history_import_ledger
  where source_locator=locator;
  if found then
    if prior.source_fingerprint<>fingerprint then
      raise exception 'Previously imported source changed: %',locator;
    end if;
    return prior.target_id;
  end if;

  target:=(p_record->>'id')::uuid;
  if kind='equipment' then
    target_code:=btrim(p_record->>'code');
    target_name:=btrim(p_record->>'name');
    if length(target_code) not between 1 and 100
      or length(target_name) not between 1 and 200
    then
      raise exception 'Invalid historical equipment';
    end if;
    select id into target_equipment
    from public.gmea_rental_equipment
    where lower(code)=lower(target_code);
    if found then
      if not exists(
        select 1 from public.gmea_rental_equipment
        where id=target_equipment and lower(name)=lower(target_name)
      ) then
        raise exception 'Historical equipment code already has another name';
      end if;
      target:=target_equipment;
    else
      insert into public.gmea_rental_equipment(
        id,code,name,equipment_type,plate_number,notes,status,is_active,
        created_by,updated_by
      ) values(
        target,target_code,target_name,
        coalesce(nullif(p_record->>'equipmentType',''),'Other'),
        '','Historical workbook import','inactive',false,p_actor,p_actor
      );
    end if;
  elsif kind='expense' then
    select id into target_category
    from public.gmea_rental_expense_categories
    where lower(name)=lower(p_record->>'category') and is_active;
    if not found then raise exception 'Historical expense category not found'; end if;

    target_name:=nullif(btrim(coalesce(p_record->>'equipment','')),'');
    target_equipment:=null;
    if target_name is not null then
      select id into target_equipment
      from public.gmea_rental_equipment
      where lower(name)=lower(target_name);
      if not found then
        raise exception 'Historical equipment not found: %',target_name;
      end if;
    end if;
    target_amount:=(p_record->>'amount')::numeric;
    if target_amount<=0 then raise exception 'Invalid historical amount'; end if;
    insert into public.gmea_rental_expenses(
      id,rental_id,equipment_id,category_id,expense_date,description,
      supplier,invoice_number,amount,refunded_amount,vat_mode,vat_rate,
      method,notes,created_by,updated_by
    ) values(
      target,null,target_equipment,target_category,
      (p_record->>'date')::date,p_record->>'rawDescription',
      coalesce(p_record->>'payee',''),'',target_amount,0,'off',0,'',
      'Historical import; source: '||locator||
        '; source-fingerprint:'||fingerprint,
      p_actor,p_actor
    );
    update public.gmea_rental_expense_notifications
    set read_at=coalesce(read_at,now())
    where expense_id=target;
  else
    target_month:=(p_record->>'month')::date;
    target_amount:=(p_record->>'amount')::numeric;
    if extract(day from target_month)<>1 or target_amount<=0 then
      raise exception 'Invalid historical income';
    end if;
    select id into target_equipment
    from public.gmea_rental_historical_income
    where income_month=target_month;
    if found then
      if not exists(
        select 1 from public.gmea_rental_historical_income
        where id=target_equipment and amount=target_amount
      ) then
        raise exception 'Historical income month already has another amount';
      end if;
      target:=target_equipment;
    else
      insert into public.gmea_rental_historical_income(
        id,income_month,amount,source_sheet,source_cell,
        source_fingerprint,notes,created_by
      ) values(
        target,target_month,target_amount,p_record->>'sheet',
        p_record->>'amountCell',fingerprint,
        'Monthly aggregate only; no rental transaction was fabricated',
        p_actor
      );
    end if;
  end if;

  insert into public.gmea_rental_history_import_ledger(
    source_locator,source_fingerprint,record_kind,target_id,
    source_payload,imported_by
  ) values(locator,fingerprint,kind,target,p_record,p_actor);
  return target;
end
$$;

revoke all on function public.import_gmea_rental_history_record(uuid,jsonb)
  from public,anon,authenticated;
grant execute on function public.import_gmea_rental_history_record(uuid,jsonb)
  to service_role;

commit;
