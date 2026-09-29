-- Adds optional per-project tax while preserving pre-tax contract revenue.
-- Safe to run after gmea-01 through gmea-06 on new or existing environments.
begin;

alter table public.gmea_projects
  add column if not exists tax_rate numeric(5,2);

update public.gmea_projects set tax_rate=0 where tax_rate is null;

alter table public.gmea_projects
  alter column tax_rate set default 0,
  alter column tax_rate set not null;

do $$
begin
  if not exists(
    select 1 from pg_constraint
    where conname='gmea_project_tax_rate_range'
      and conrelid='public.gmea_projects'::regclass
  ) then
    alter table public.gmea_projects
      add constraint gmea_project_tax_rate_range
      check(tax_rate between 0 and 100);
  end if;
end $$;

-- Retain the mature mutation implementation, including appearance handling,
-- and adapt contract commands so its existing schedule checks use gross total.
do $$
begin
  if to_regprocedure('public.mutate_gmea_project_without_tax(uuid,uuid,integer,jsonb)') is null then
    alter function public.mutate_gmea_project(uuid,uuid,integer,jsonb)
      rename to mutate_gmea_project_without_tax;
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
  adjusted_command jsonb:=p_command;
  contract_value jsonb;
  base_contract numeric;
  project_tax_rate numeric;
  gross_contract numeric;
begin
  if p_command->>'kind' in ('create_project','contract_terms') then
    contract_value:=case
      when p_command->>'kind'='create_project'
        then p_command->'value'->'contract'
      else p_command->'value'
    end;
    base_contract:=(contract_value->>'contract_amount')::numeric;
    project_tax_rate:=coalesce((contract_value->>'tax_rate')::numeric,0);

    if project_tax_rate < 0 or project_tax_rate > 100 then
      raise exception 'Tax rate must be between 0 and 100.';
    end if;

    gross_contract:=round(base_contract * (1 + project_tax_rate / 100),2);
    adjusted_command:=case
      when p_command->>'kind'='create_project' then
        jsonb_set(p_command,'{value,contract,contract_amount}',to_jsonb(gross_contract),true)
      else
        jsonb_set(p_command,'{value,contract_amount}',to_jsonb(gross_contract),true)
    end;
  end if;

  result_id:=public.mutate_gmea_project_without_tax(
    p_actor,
    p_project,
    p_version,
    adjusted_command
  );

  if p_command->>'kind' in ('create_project','contract_terms') then
    update public.gmea_projects
    set contract_amount=base_contract,tax_rate=project_tax_rate
    where id=result_id;
  end if;

  return result_id;
end $$;

revoke all on function public.mutate_gmea_project_without_tax(uuid,uuid,integer,jsonb)
  from public,anon,authenticated;
grant execute on function public.mutate_gmea_project_without_tax(uuid,uuid,integer,jsonb)
  to service_role;
revoke all on function public.mutate_gmea_project(uuid,uuid,integer,jsonb)
  from public,anon,authenticated;
grant execute on function public.mutate_gmea_project(uuid,uuid,integer,jsonb)
  to service_role;

commit;
