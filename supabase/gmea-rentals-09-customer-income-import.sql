-- Source-preserving customer income archive. Uses the existing Rentals access policy.
begin;
create table if not exists public.gmea_rental_income_imports (
  source_hash text primary key check(source_hash ~ '^[0-9a-f]{64}$'),
  source_name text not null unique,
  parser_version integer not null check(parser_version=1),
  records jsonb not null check(jsonb_typeof(records)='array' and jsonb_array_length(records) between 1 and 5000),
  source_snapshot jsonb not null check(jsonb_typeof(source_snapshot)='object'),
  imported_by uuid not null references public.profiles(id) on delete restrict,
  imported_at timestamptz not null default now()
);
alter table public.gmea_rental_income_imports enable row level security;
revoke all on public.gmea_rental_income_imports from anon,authenticated;
grant select on public.gmea_rental_income_imports to authenticated;
grant all on public.gmea_rental_income_imports to service_role;
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='gmea_rental_income_imports' and policyname='gmea_rentals_read') then
    create policy gmea_rentals_read on public.gmea_rental_income_imports for select to authenticated using(public.can_read_gmea_rentals());
  end if;
end $$;

create or replace function public.import_gmea_customer_income(p_actor uuid,p_batch jsonb)
returns text language plpgsql security definer set search_path=public as $$
declare prior public.gmea_rental_income_imports; entry jsonb; receipt jsonb;
begin
  if not exists(select 1 from public.profiles where id=p_actor and role::text='gmea' and is_active) then
    raise exception 'Only an active GMEA user can import customer income';
  end if;
  if jsonb_typeof(p_batch->'records') is distinct from 'array'
    or jsonb_typeof(p_batch->'source_snapshot') is distinct from 'object'
    or coalesce(p_batch->>'source_hash','') !~ '^[0-9a-f]{64}$'
    or coalesce((p_batch->>'parser_version')::int,0)<>1
    or length(coalesce(p_batch->>'source_name','')) not between 1 and 255
    or jsonb_array_length(p_batch->'records') not between 1 and 5000 then
    raise exception 'Invalid customer income import';
  end if;
  for entry in select * from jsonb_array_elements(p_batch->'records') loop
    if length(coalesce(entry->>'id',''))=0 or length(coalesce(entry->>'client',''))=0
      or jsonb_typeof(entry->'receipts') is distinct from 'array'
      or jsonb_typeof(entry->'issues') is distinct from 'array'
      or jsonb_typeof(entry->'sourceRows') is distinct from 'array' then
      raise exception 'Invalid customer income record';
    end if;
    for receipt in select * from jsonb_array_elements(entry->'receipts') loop
      if coalesce((receipt->>'amount')::numeric,0)<=0
        or coalesce(receipt->>'type','') not in ('down_payment','full_payment','partial_payment','unclassified')
        or jsonb_typeof(receipt->'confirmed') is distinct from 'boolean' then
        raise exception 'Invalid income receipt';
      end if;
      if (receipt->>'confirmed')::boolean and (coalesce(receipt->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' or (receipt->>'date')::date is null) then
        raise exception 'Confirmed receipts require an exact payment date';
      end if;
    end loop;
  end loop;
  perform pg_advisory_xact_lock(hashtextextended(p_batch->>'source_name',0));
  select * into prior from public.gmea_rental_income_imports where source_name=p_batch->>'source_name';
  if found then
    if prior.source_hash<>p_batch->>'source_hash' or prior.records<>p_batch->'records'
      or prior.source_snapshot<>p_batch->'source_snapshot' then raise exception 'Previously imported workbook or parser output changed'; end if;
    return prior.source_hash;
  end if;
  insert into public.gmea_rental_income_imports(source_hash,source_name,parser_version,records,source_snapshot,imported_by)
    values(p_batch->>'source_hash',p_batch->>'source_name',1,p_batch->'records',p_batch->'source_snapshot',p_actor);
  return p_batch->>'source_hash';
end $$;
revoke all on function public.import_gmea_customer_income(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.import_gmea_customer_income(uuid,jsonb) to service_role;
commit;
