-- Equipment-management upgrade. Safe after gmea-rentals-01-foundation.sql.
begin;

alter table public.gmea_rental_equipment
  add column if not exists equipment_type text not null default 'Other',
  add column if not exists plate_number text not null default '',
  add column if not exists notes text not null default '',
  add column if not exists is_active boolean not null default true;

alter table public.gmea_rental_equipment
  alter column default_rate drop not null,
  alter column default_rate drop default,
  alter column rate_unit drop not null,
  alter column rate_unit drop default;

update public.gmea_rental_equipment
set status='on_rental'
where status='rented';

update public.gmea_rental_equipment
set is_active=(status <> 'inactive');

alter table public.gmea_rental_equipment
  drop constraint if exists gmea_rental_equipment_status_check;

alter table public.gmea_rental_equipment
  add constraint gmea_rental_equipment_status_check
  check(status in ('available','reserved','on_rental','maintenance','inactive'));

create index if not exists gmea_rental_equipment_active_status_idx
  on public.gmea_rental_equipment(is_active,status,name);

create or replace function public.mutate_gmea_rental_equipment(
  p_actor uuid,
  p_equipment uuid,
  p_version integer,
  p_command jsonb
)
returns uuid language plpgsql security definer set search_path=public as $$
declare
  equipment public.gmea_rental_equipment;
  value jsonb:=p_command->'value';
  command_kind text:=p_command->>'kind';
  result_id uuid;
begin
  if not exists(
    select 1 from public.profiles
    where id=p_actor and role::text='gmea' and is_active
  ) then
    raise exception 'Only active GMEA users can manage equipment';
  end if;

  if p_equipment is null then
    if command_kind <> 'create' then raise exception 'Create equipment first'; end if;
    insert into public.gmea_rental_equipment(
      code,name,equipment_type,plate_number,default_rate,rate_unit,notes,status,
      is_active,created_by,updated_by
    ) values(
      value->>'code',value->>'name',value->>'equipment_type',
      coalesce(value->>'plate_number',''),
      nullif(value->>'default_rate','')::numeric,nullif(value->>'rate_unit',''),
      coalesce(value->>'notes',''),value->>'status',
      coalesce((value->>'is_active')::boolean,true),p_actor,p_actor
    ) returning id into result_id;
    return result_id;
  end if;

  select * into equipment from public.gmea_rental_equipment
  where id=p_equipment for update;
  if not found then raise exception 'Equipment not found'; end if;
  if p_version is distinct from equipment.version then
    raise exception 'This equipment changed. Reload before saving again.';
  end if;

  if command_kind='deactivate' then
    update public.gmea_rental_equipment set
      status='inactive',is_active=false,version=version+1,updated_at=now(),updated_by=p_actor
    where id=p_equipment;
  elsif command_kind='update' then
    update public.gmea_rental_equipment set
      code=value->>'code',name=value->>'name',equipment_type=value->>'equipment_type',
      plate_number=coalesce(value->>'plate_number',''),
      default_rate=nullif(value->>'default_rate','')::numeric,
      rate_unit=nullif(value->>'rate_unit',''),notes=coalesce(value->>'notes',''),
      status=value->>'status',is_active=coalesce((value->>'is_active')::boolean,true),
      version=version+1,updated_at=now(),updated_by=p_actor
    where id=p_equipment;
  else
    raise exception 'Invalid equipment operation';
  end if;
  return p_equipment;
end $$;

revoke all on function public.mutate_gmea_rental_equipment(uuid,uuid,integer,jsonb)
  from public,anon,authenticated;
grant execute on function public.mutate_gmea_rental_equipment(uuid,uuid,integer,jsonb)
  to service_role;

commit;
