-- Rental expenses and basic driver/operator handling.
-- Safe to run after gmea-rentals-04.
begin;

update public.gmea_rental_workers
set role_name='Other'
where role_name not in ('Driver','Operator','Other');

alter table public.gmea_rental_workers
  alter column role_name set default 'Other';

do $$
begin
  if not exists(
    select 1 from pg_constraint
    where conname='gmea_rental_worker_role_valid'
      and conrelid='public.gmea_rental_workers'::regclass
  ) then
    alter table public.gmea_rental_workers
      add constraint gmea_rental_worker_role_valid
      check(role_name in ('Driver','Operator','Other'));
  end if;
  if not exists(
    select 1 from information_schema.columns
    where table_schema='public'
      and table_name='gmea_rental_worker_assignments'
      and column_name='equipment_id'
  ) then
    alter table public.gmea_rental_worker_assignments
      add column equipment_id uuid
      references public.gmea_rental_equipment(id) on delete restrict;
  end if;
  if not exists(
    select 1 from information_schema.columns
    where table_schema='public'
      and table_name='gmea_rental_expenses'
      and column_name='version'
  ) then
    alter table public.gmea_rental_expenses
      add column version integer not null default 1 check(version>=1);
  end if;
end $$;

create index if not exists gmea_rental_worker_assignments_equipment_idx
  on public.gmea_rental_worker_assignments(equipment_id,rental_id);
create unique index if not exists gmea_rental_worker_assignment_rental_unique
  on public.gmea_rental_worker_assignments(rental_id,worker_id)
  where equipment_id is null and status='assigned';
create unique index if not exists gmea_rental_worker_assignment_equipment_unique
  on public.gmea_rental_worker_assignments(rental_id,equipment_id,worker_id)
  where equipment_id is not null and status='assigned';

insert into public.gmea_rental_expense_categories(name,sort_order)
select value.name,value.sort_order
from (values
  ('Diesel/Fuel',10),
  ('Gasoline',20),
  ('Maintenance',30),
  ('Repair',40),
  ('Parts',50),
  ('Registration/Renewal',60),
  ('Driver',70),
  ('Operator',80),
  ('Labor',90),
  ('Cash Advance',100),
  ('Miscellaneous',110)
) as value(name,sort_order)
where not exists(
  select 1 from public.gmea_rental_expense_categories category
  where lower(category.name)=lower(value.name)
);

create or replace function public.mutate_gmea_rental_worker(
  p_actor uuid,
  p_worker uuid,
  p_version integer,
  p_command jsonb
)
returns uuid language plpgsql security definer set search_path=public as $$
declare
  worker public.gmea_rental_workers;
  value jsonb:=p_command->'value';
  kind text:=p_command->>'kind';
  worker_id uuid;
  worker_role text;
begin
  if not exists(
    select 1 from public.profiles
    where id=p_actor and role::text='gmea' and is_active
  ) then
    raise exception 'Only active GMEA users can manage rental workers';
  end if;
  if kind='create' then
    if p_worker is not null or p_version is not null then
      raise exception 'Invalid worker operation';
    end if;
    worker_role:=value->>'role';
    if worker_role not in ('Driver','Operator','Other') then
      raise exception 'Invalid worker role';
    end if;
    insert into public.gmea_rental_workers(
      full_name,role_name,contact_number,status,created_by,updated_by
    ) values(
      value->>'name',worker_role,coalesce(value->>'phone',''),
      case when (value->>'is_active')::boolean then 'active' else 'inactive' end,
      p_actor,p_actor
    ) returning id into worker_id;
    return worker_id;
  end if;
  if p_worker is null or p_version is null then
    raise exception 'Worker and version are required';
  end if;
  select * into worker from public.gmea_rental_workers
  where id=p_worker for update;
  if not found then raise exception 'Worker not found'; end if;
  if worker.version<>p_version then
    raise exception 'This worker changed. Reload before saving';
  end if;
  if kind='update' then
    worker_role:=value->>'role';
    if worker_role not in ('Driver','Operator','Other') then
      raise exception 'Invalid worker role';
    end if;
    update public.gmea_rental_workers set
      full_name=value->>'name',
      role_name=worker_role,
      contact_number=coalesce(value->>'phone',''),
      status=case when (value->>'is_active')::boolean then 'active' else 'inactive' end,
      version=version+1,updated_by=p_actor,updated_at=now()
    where id=p_worker;
  elsif kind='deactivate' then
    update public.gmea_rental_workers set
      status='inactive',version=version+1,updated_by=p_actor,updated_at=now()
    where id=p_worker;
  else
    raise exception 'Invalid worker operation';
  end if;
  return p_worker;
end $$;

revoke all on function public.mutate_gmea_rental_worker(uuid,uuid,integer,jsonb)
  from public,anon,authenticated;
grant execute on function public.mutate_gmea_rental_worker(uuid,uuid,integer,jsonb)
  to service_role;

commit;

begin;

create or replace function public.mutate_gmea_rental_expense(
  p_actor uuid,
  p_expense uuid,
  p_version integer,
  p_command jsonb
)
returns uuid language plpgsql security definer set search_path=public as $$
declare
  expense public.gmea_rental_expenses;
  value jsonb:=p_command->'value';
  kind text:=p_command->>'kind';
  target_expense_id uuid;
  target_rental uuid;
  target_equipment uuid;
  target_category uuid;
  target_vat_mode text;
  target_vat_rate numeric(5,2);
begin
  if not exists(
    select 1 from public.profiles
    where id=p_actor and role::text='gmea' and is_active
  ) then
    raise exception 'Only active GMEA users can manage rental expenses';
  end if;
  if kind='delete' then
    if p_expense is null or p_version is null then
      raise exception 'Expense and version are required';
    end if;
    select * into expense from public.gmea_rental_expenses
    where id=p_expense for update;
    if not found then raise exception 'Expense not found'; end if;
    if expense.version<>p_version then
      raise exception 'This expense changed. Reload before saving';
    end if;
    delete from public.gmea_rental_expenses where id=p_expense;
    return p_expense;
  end if;
  if kind not in ('create','update') then
    raise exception 'Invalid rental expense operation';
  end if;

  target_expense_id:=(value->>'id')::uuid;
  target_rental:=nullif(value->>'rental_id','')::uuid;
  target_equipment:=nullif(value->>'equipment_id','')::uuid;
  target_category:=(value->>'category_id')::uuid;
  target_vat_mode:=value->>'vat_mode';
  target_vat_rate:=(value->>'vat_rate')::numeric;
  if not exists(
    select 1 from public.gmea_rental_expense_categories
    where id=target_category and is_active
  ) then
    raise exception 'Select an active expense category';
  end if;
  if target_rental is not null and not exists(
    select 1 from public.gmea_rentals where id=target_rental
  ) then
    raise exception 'Rental not found';
  end if;
  if target_equipment is not null and not exists(
    select 1 from public.gmea_rental_equipment where id=target_equipment
  ) then
    raise exception 'Equipment not found';
  end if;
  if target_rental is not null and target_equipment is not null and not exists(
    select 1 from public.gmea_rental_items
    where rental_id=target_rental and equipment_id=target_equipment
  ) then
    raise exception 'Equipment is not assigned to the selected rental';
  end if;
  if target_vat_mode not in ('off','inclusive','exclusive')
    or (target_vat_mode='off' and target_vat_rate<>0)
    or (target_vat_mode<>'off' and target_vat_rate<>12) then
    raise exception 'Invalid VAT treatment';
  end if;
  if (value->>'amount')::numeric<=0
    or (value->>'refunded_amount')::numeric<0 then
    raise exception 'Enter valid expense and refunded amounts';
  end if;

  if kind='create' then
    if p_expense is not null or p_version is not null then
      raise exception 'Invalid expense operation';
    end if;
    insert into public.gmea_rental_expenses(
      id,rental_id,equipment_id,category_id,expense_date,description,supplier,
      invoice_number,amount,refunded_amount,vat_mode,vat_rate,method,notes,
      created_by,updated_by
    ) values(
      target_expense_id,target_rental,target_equipment,target_category,
      (value->>'date')::date,value->>'description',coalesce(value->>'supplier',''),
      coalesce(value->>'invoice_number',''),(value->>'amount')::numeric,
      (value->>'refunded_amount')::numeric,target_vat_mode,target_vat_rate,
      coalesce(value->>'method',''),coalesce(value->>'notes',''),p_actor,p_actor
    );
    insert into public.gmea_rental_expense_notifications(
      expense_id,rental_id,recipient_id
    )
    select target_expense_id,target_rental,profile.id
    from public.profiles profile
    where profile.role::text='ceo' and profile.is_active
    on conflict(expense_id,recipient_id) do nothing;
  else
    if p_expense is null or p_expense<>target_expense_id or p_version is null then
      raise exception 'Expense and version are required';
    end if;
    select * into expense from public.gmea_rental_expenses
    where id=p_expense for update;
    if not found then raise exception 'Expense not found'; end if;
    if expense.version<>p_version then
      raise exception 'This expense changed. Reload before saving';
    end if;
    update public.gmea_rental_expenses set
      rental_id=target_rental,equipment_id=target_equipment,
      category_id=target_category,expense_date=(value->>'date')::date,
      description=value->>'description',supplier=coalesce(value->>'supplier',''),
      invoice_number=coalesce(value->>'invoice_number',''),
      amount=(value->>'amount')::numeric,
      refunded_amount=(value->>'refunded_amount')::numeric,
      vat_mode=target_vat_mode,vat_rate=target_vat_rate,method=coalesce(value->>'method',''),
      notes=coalesce(value->>'notes',''),version=version+1,
      updated_by=p_actor,updated_at=now()
    where id=p_expense;
  end if;
  return target_expense_id;
end $$;

revoke all on function public.mutate_gmea_rental_expense(uuid,uuid,integer,jsonb)
  from public,anon,authenticated;
grant execute on function public.mutate_gmea_rental_expense(uuid,uuid,integer,jsonb)
  to service_role;

commit;

begin;

create or replace function public.mutate_gmea_rental_assignment(
  p_actor uuid,
  p_rental uuid,
  p_version integer,
  p_command jsonb
)
returns uuid language plpgsql security definer set search_path=public as $$
declare
  rental public.gmea_rentals;
  worker public.gmea_rental_workers;
  kind text:=p_command->>'kind';
  value jsonb:=p_command->'value';
  assignment_id uuid;
  target_equipment uuid;
begin
  if not exists(
    select 1 from public.profiles
    where id=p_actor and role::text='gmea' and is_active
  ) then
    raise exception 'Only active GMEA users can manage rental assignments';
  end if;
  select * into rental from public.gmea_rentals
  where id=p_rental for update;
  if not found then raise exception 'Rental not found'; end if;
  if p_version is null or rental.version<>p_version then
    raise exception 'This rental changed. Reload before saving';
  end if;
  if kind='assign_worker' then
    assignment_id:=(value->>'id')::uuid;
    select * into worker from public.gmea_rental_workers
    where id=(value->>'worker_id')::uuid;
    if not found or worker.status<>'active' then
      raise exception 'Select an active worker';
    end if;
    target_equipment:=nullif(value->>'equipment_id','')::uuid;
    if target_equipment is not null and not exists(
      select 1 from public.gmea_rental_items
      where rental_id=p_rental and equipment_id=target_equipment
    ) then
      raise exception 'Equipment is not assigned to this rental';
    end if;
    insert into public.gmea_rental_worker_assignments(
      id,rental_id,equipment_id,worker_id,assigned_from,assigned_until,
      rate,status,notes
    ) values(
      assignment_id,p_rental,target_equipment,worker.id,rental.start_date,
      rental.expected_return_date,0,'assigned',''
    );
  elsif kind='remove_assignment' then
    assignment_id:=(p_command->>'assignment_id')::uuid;
    delete from public.gmea_rental_worker_assignments
    where id=assignment_id and rental_id=p_rental;
    if not found then raise exception 'Assignment not found'; end if;
  else
    raise exception 'Invalid rental assignment operation';
  end if;
  update public.gmea_rentals set
    version=version+1,updated_by=p_actor,updated_at=now()
  where id=p_rental;
  return p_rental;
end $$;

revoke all on function public.mutate_gmea_rental_assignment(uuid,uuid,integer,jsonb)
  from public,anon,authenticated;
grant execute on function public.mutate_gmea_rental_assignment(uuid,uuid,integer,jsonb)
  to service_role;

commit;
