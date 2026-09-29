-- Adds an active/completed lifecycle without removing project history.
-- Safe to run after gmea-01 through gmea-07 on new or existing environments.
begin;

alter table public.gmea_projects
  add column if not exists status text,
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by uuid references public.profiles(id) on delete set null;

update public.gmea_projects set status='active' where status is null;

alter table public.gmea_projects
  alter column status set default 'active',
  alter column status set not null;

do $$
begin
  if not exists(
    select 1 from pg_constraint
    where conname='gmea_project_status_valid'
      and conrelid='public.gmea_projects'::regclass
  ) then
    alter table public.gmea_projects
      add constraint gmea_project_status_valid
      check(status in ('active','completed'));
  end if;
end $$;

do $$
begin
  if to_regprocedure('public.mutate_gmea_project_without_status(uuid,uuid,integer,jsonb)') is null then
    alter function public.mutate_gmea_project(uuid,uuid,integer,jsonb)
      rename to mutate_gmea_project_without_status;
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
  current_project public.gmea_projects;
  next_status text;
begin
  if p_command->>'kind'<>'project_status' then
    return public.mutate_gmea_project_without_status(
      p_actor,
      p_project,
      p_version,
      p_command
    );
  end if;

  if not exists(
    select 1 from public.profiles
    where id=p_actor and role::text='gmea' and is_active
  ) then
    raise exception 'Only active GMEA users can manage projects';
  end if;
  if p_project is null then raise exception 'Create a project first'; end if;

  select * into current_project
  from public.gmea_projects
  where id=p_project
  for update;
  if not found then raise exception 'Project not found'; end if;
  if p_version is distinct from current_project.version then
    raise exception 'This project changed. Reload the page before saving again.';
  end if;

  next_status:=p_command->'value'->>'status';
  if next_status not in ('active','completed') then
    raise exception 'Select a valid project status.';
  end if;

  update public.gmea_projects set
    status=next_status,
    completed_at=case when next_status='completed' then now() else null end,
    completed_by=case when next_status='completed' then p_actor else null end,
    updated_by=p_actor,
    version=version+1,
    updated_at=now()
  where id=p_project;

  return p_project;
end $$;

revoke all on function public.mutate_gmea_project_without_status(uuid,uuid,integer,jsonb)
  from public,anon,authenticated;
grant execute on function public.mutate_gmea_project_without_status(uuid,uuid,integer,jsonb)
  to service_role;
revoke all on function public.mutate_gmea_project(uuid,uuid,integer,jsonb)
  from public,anon,authenticated;
grant execute on function public.mutate_gmea_project(uuid,uuid,integer,jsonb)
  to service_role;

commit;
