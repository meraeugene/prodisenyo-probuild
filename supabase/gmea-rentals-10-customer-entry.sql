-- Apply after Rentals migrations 01–09. Customer income does not create equipment bookings.
begin;
create table if not exists public.gmea_rental_customer_income (
  id uuid primary key,
  client text not null check(length(btrim(client)) between 1 and 200),
  location text not null check(length(btrim(location)) between 1 and 200),
  service text not null default '' check(length(service)<=200),
  total_amount numeric(14,2) not null check(total_amount>0 and total_amount<=10000000000),
  payments jsonb not null default '[]' check(jsonb_typeof(payments)='array'),
  version integer not null default 1 check(version>0),
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id),
  updated_at timestamptz not null default now()
);
alter table public.gmea_rental_customer_income enable row level security;
revoke all on public.gmea_rental_customer_income from anon,authenticated;
grant select on public.gmea_rental_customer_income to authenticated;
grant all on public.gmea_rental_customer_income to service_role;
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='gmea_rental_customer_income' and policyname='gmea_rentals_read') then
    create policy gmea_rentals_read on public.gmea_rental_customer_income for select to authenticated using(public.can_read_gmea_rentals());
  end if;
end $$;
alter table public.gmea_rental_expenses add column if not exists income_record_id text;
create index if not exists gmea_rental_expenses_income_record on public.gmea_rental_expenses(income_record_id);

create or replace function public.save_gmea_customer_income(p_actor uuid,p_input jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare
  entry public.gmea_rental_customer_income;
  target uuid := (p_input->>'id')::uuid;
  expected integer := (p_input->>'version')::integer;
  down_amount numeric := (p_input->>'down_payment')::numeric;
  full_amount numeric := (p_input->>'full_payment')::numeric;
  total numeric := (p_input->>'total_amount')::numeric;
  receipts jsonb := '[]'; receipt_type text; paid numeric; paid_date date; collected numeric;
begin
  if not exists(select 1 from public.profiles where id=p_actor and role::text='gmea' and is_active) then
    raise exception 'Only active GMEA users can record rental income';
  end if;
  if target is null or total is null or total<=0 or total>10000000000
    or down_amount is null or full_amount is null or down_amount<0 or full_amount<0
    or down_amount+full_amount<=0 or down_amount+full_amount>total
    or length(btrim(coalesce(p_input->>'client',''))) not between 1 and 200
    or length(btrim(coalesce(p_input->>'location',''))) not between 1 and 200
    or length(coalesce(p_input->>'service',''))>200
    or length(btrim(coalesce(p_input->>'method',''))) not between 1 and 100 then
    raise exception 'Enter valid company, location, amounts and mode of payment';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(target::text,0));
  select * into entry from public.gmea_rental_customer_income where id=target for update;
  if found then
    if expected is null or entry.version<>expected then raise exception 'This income entry changed. Reload before saving'; end if;
    if entry.client<>p_input->>'client' or entry.location<>p_input->>'location' or entry.total_amount<>total then
      raise exception 'Existing company, location and rental charge cannot be changed when adding payments';
    end if;
    select coalesce(sum((payment->>'amount')::numeric),0) into collected from jsonb_array_elements(entry.payments) payment;
    if collected+down_amount+full_amount>entry.total_amount then raise exception 'Payments exceed the remaining rental balance'; end if;
  elsif expected is not null then raise exception 'Income entry no longer exists';
  end if;
  foreach receipt_type in array array['down_payment','full_payment'] loop
    paid := (p_input->>receipt_type)::numeric;
    if paid>0 then
      if coalesce(p_input->>(receipt_type||'_date'),'') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Enter a payment date'; end if;
      paid_date := (p_input->>(receipt_type||'_date'))::date;
      if paid_date>(now() at time zone 'Asia/Manila')::date then raise exception 'Payment date cannot be in the future'; end if;
      receipts := receipts || jsonb_build_array(jsonb_build_object(
        'id',gen_random_uuid(),'rental_id',target,'amount',round(paid,2),'payment_date',paid_date,
        'payment_type',receipt_type,'method',p_input->>'method','reference_number','','notes','',
        'status','posted','recorded_by',p_actor,'recorded_at',now(), 'voided_by',null,'voided_at',null,'void_reason',''
      ));
    end if;
  end loop;
  if entry.id is null then
    insert into public.gmea_rental_customer_income(id,client,location,service,total_amount,payments,created_by)
      values(target,btrim(p_input->>'client'),btrim(p_input->>'location'),coalesce(p_input->>'service',''),round(total,2),receipts,p_actor);
  else
    update public.gmea_rental_customer_income set payments=payments||receipts,version=version+1,updated_at=now() where id=target;
  end if;
  return target;
end $$;
revoke all on function public.save_gmea_customer_income(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_gmea_customer_income(uuid,jsonb) to service_role;

create or replace function public.create_gmea_customer_expense(p_actor uuid,p_record text,p_command jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare target uuid;
begin
  if not exists(select 1 from public.profiles where id=p_actor and role::text='gmea' and is_active) then
    raise exception 'Only active GMEA users can record rental expenses';
  end if;
  if coalesce(p_command->>'kind','')<>'create' or nullif(p_command->'value'->>'rental_id','') is not null then
    raise exception 'Invalid customer rental expense';
  end if;
  if not exists(select 1 from public.gmea_rental_customer_income where id::text=p_record)
    and not exists(select 1 from public.gmea_rental_income_imports, jsonb_array_elements(records) record where record->>'id'=p_record) then
    raise exception 'Select an existing customer income record';
  end if;
  target := public.mutate_gmea_rental_expense(p_actor,null,null,p_command);
  update public.gmea_rental_expenses set income_record_id=p_record where id=target;
  return target;
end $$;
revoke all on function public.create_gmea_customer_expense(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.create_gmea_customer_expense(uuid,text,jsonb) to service_role;
commit;
notify pgrst, 'reload schema';
