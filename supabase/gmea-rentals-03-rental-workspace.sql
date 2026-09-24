-- Rental creation and equipment scheduling. Safe after gmea-rentals-02.
begin;

do $$
begin
  if not exists(
    select 1 from pg_constraint
    where conname='gmea_rental_item_fixed_quantity'
      and conrelid='public.gmea_rental_items'::regclass
  ) then
    alter table public.gmea_rental_items
      add constraint gmea_rental_item_fixed_quantity
      check(rate_unit <> 'fixed' or quantity=1) not valid;
  end if;
end $$;

create unique index if not exists gmea_rental_items_equipment_unique
  on public.gmea_rental_items(rental_id,equipment_id);

create or replace function public.mutate_gmea_rental(
  p_actor uuid,
  p_rental uuid,
  p_version integer,
  p_command jsonb
)
returns uuid language plpgsql security definer set search_path=public as $$
declare
  value jsonb:=p_command->'value';
  item jsonb;
  equipment public.gmea_rental_equipment;
  rental_id uuid;
  target_equipment_id uuid;
  start_on date;
  end_on date;
  rental_status text;
  rate_type text;
  unit_rate numeric(16,2);
  billable_quantity numeric(12,2);
  item_count integer;
begin
  if not exists(
    select 1 from public.profiles
    where id=p_actor and role::text='gmea' and is_active
  ) then
    raise exception 'Only active GMEA users can manage rentals';
  end if;
  if p_rental is not null or p_version is not null or p_command->>'kind' <> 'create' then
    raise exception 'Invalid rental operation';
  end if;

  start_on:=(value->>'start_date')::date;
  end_on:=(value->>'end_date')::date;
  rental_status:=value->>'status';
  if end_on < start_on then raise exception 'End date cannot be before start date'; end if;
  if rental_status not in ('draft','active','completed','cancelled') then
    raise exception 'Invalid rental status';
  end if;
  select jsonb_array_length(value->'items') into item_count;
  if item_count not between 1 and 100 then
    raise exception 'Add between 1 and 100 equipment items';
  end if;
  if exists(
    select 1 from jsonb_array_elements(value->'items') proposed
    group by proposed->>'equipment_id' having count(*) > 1
  ) then
    raise exception 'Each equipment unit can only appear once per rental';
  end if;

  -- Lock selected units in stable order to serialize concurrent scheduling.
  perform 1 from public.gmea_rental_equipment e
  where e.id in (
    select (proposed->>'equipment_id')::uuid
    from jsonb_array_elements(value->'items') proposed
  ) order by e.id for update;

  for item in select * from jsonb_array_elements(value->'items') loop
    target_equipment_id:=(item->>'equipment_id')::uuid;
    select * into equipment from public.gmea_rental_equipment where id=target_equipment_id;
    if not found then raise exception 'Equipment not found'; end if;
    if not equipment.is_active or equipment.status in ('maintenance','inactive') then
      raise exception 'Equipment % is not available for rental',equipment.name;
    end if;
    if exists(
      select 1
      from public.gmea_rental_items existing_item
      join public.gmea_rentals existing_rental on existing_rental.id=existing_item.rental_id
      where existing_item.equipment_id=target_equipment_id
        and existing_rental.status <> 'cancelled'
        and existing_rental.start_date <= end_on
        and coalesce(existing_rental.expected_return_date,existing_rental.start_date) >= start_on
    ) then
      raise exception 'Equipment % is already assigned during these dates',equipment.name;
    end if;
  end loop;

  insert into public.gmea_rentals(
    rental_number,customer_name,site_location,start_date,expected_return_date,
    notes,status,created_by,updated_by
  ) values(
    value->>'rental_number',value->>'client',value->>'location',start_on,end_on,
    coalesce(value->>'notes',''),rental_status,p_actor,p_actor
  ) returning id into rental_id;

  for item in select * from jsonb_array_elements(value->'items') loop
    target_equipment_id:=(item->>'equipment_id')::uuid;
    select * into equipment from public.gmea_rental_equipment where id=target_equipment_id;
    rate_type:=item->>'rate_type';
    unit_rate:=(item->>'unit_rate')::numeric;
    billable_quantity:=case when rate_type='fixed' then 1 else (item->>'quantity')::numeric end;
    if rate_type not in ('hour','day','week','month','fixed')
      or unit_rate < 0 or billable_quantity <= 0 then
      raise exception 'Invalid equipment billing details';
    end if;
    insert into public.gmea_rental_items(
      id,rental_id,equipment_id,equipment_name,quantity,rate,rate_unit,notes
    ) values(
      (item->>'id')::uuid,rental_id,target_equipment_id,equipment.name,
      billable_quantity,unit_rate,rate_type,''
    );
  end loop;
  return rental_id;
end $$;

revoke all on function public.mutate_gmea_rental(uuid,uuid,integer,jsonb)
  from public,anon,authenticated;
grant execute on function public.mutate_gmea_rental(uuid,uuid,integer,jsonb)
  to service_role;

commit;
