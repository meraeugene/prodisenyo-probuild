-- Adds a short project title and user-selected container color.
-- Safe to run after gmea-01 through gmea-05 on new or existing environments.
begin;

alter table public.gmea_projects
  add column if not exists title text,
  add column if not exists color text;

update public.gmea_projects
set title=coalesce(nullif(btrim(title),''),btrim(name));

update public.gmea_projects
set color=case upper(btrim(title))
  when 'MARAMAG' then '#00FF00'
  when 'BULUA' then '#FF0000'
  when 'BFAR' then '#000000'
  when 'CVH- PABX-FDAS' then '#0000FF'
  when 'CVH-CCTV NETWORK' then '#FF00FF'
  when 'CVH -IP CCTV 2AMP 13 CAMERAS' then '#FFFF00'
  when 'ROYAL CABLE PSA CONDUIT' then '#9900FF'
  when 'FULLYBOOKED KETKAI' then '#CC0000'
  else coalesce(nullif(upper(color),''),'#FFFFFF')
end;

alter table public.gmea_projects
  alter column title set default '',
  alter column title set not null,
  alter column color set default '#FFFFFF',
  alter column color set not null;

do $$
begin
  if not exists(
    select 1 from pg_constraint
    where conname='gmea_project_color_hex'
      and conrelid='public.gmea_projects'::regclass
  ) then
    alter table public.gmea_projects
      add constraint gmea_project_color_hex
      check(color ~ '^#[0-9A-F]{6}$');
  end if;
end $$;

-- Keep the mature payment/expense mutation implementation as the core, then
-- wrap it so appearance changes remain part of the same database transaction.
do $$
begin
  if to_regprocedure('public.mutate_gmea_project_core(uuid,uuid,integer,jsonb)') is null then
    alter function public.mutate_gmea_project(uuid,uuid,integer,jsonb)
      rename to mutate_gmea_project_core;
  end if;
end $$;

create or replace function public.mutate_gmea_project(
  p_actor uuid,
  p_project uuid,
  p_version integer,
  p_command jsonb
)
returns uuid language plpgsql security definer set search_path=public as $$
declare
  result_id uuid;
  details jsonb;
begin
  result_id:=public.mutate_gmea_project_core(
    p_actor,
    p_project,
    p_version,
    p_command
  );

  if p_command->>'kind' in ('create_project','project_details') then
    details:=case
      when p_command->>'kind'='create_project'
        then p_command->'value'->'details'
      else p_command->'value'
    end;
    update public.gmea_projects
    set title=details->>'title',color=upper(details->>'color')
    where id=result_id;
  end if;

  return result_id;
end $$;

revoke all on function public.mutate_gmea_project_core(uuid,uuid,integer,jsonb)
  from public,anon,authenticated;
grant execute on function public.mutate_gmea_project_core(uuid,uuid,integer,jsonb)
  to service_role;
revoke all on function public.mutate_gmea_project(uuid,uuid,integer,jsonb)
  from public,anon,authenticated;
grant execute on function public.mutate_gmea_project(uuid,uuid,integer,jsonb)
  to service_role;

commit;
