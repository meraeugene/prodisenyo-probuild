begin;

create or replace function public.mutate_gmea_project(
 p_actor uuid,
 p_project uuid,
 p_version integer,
 p_command jsonb
)
returns uuid language plpgsql security definer set search_path=public as $$
declare
 project public.gmea_projects;
 kind text:=p_command->>'kind';
 value jsonb:=p_command->'value';
 entry jsonb;
 target_id uuid;
 position integer:=0;
 affected integer;
begin
 if not exists(
  select 1 from public.profiles
  where id=p_actor and role::text='gmea' and is_active
 ) then
  raise exception 'Only active GMEA users can manage projects';
 end if;

 if p_project is null then
  if kind<>'project' then raise exception 'Create a project first'; end if;
  insert into public.gmea_projects(
   name,client,location,contract_amount,withholding_tax_rate,duration,status,created_by,updated_by
  ) values(
   value->>'name',
   value->>'client',
   value->>'location',
   (value->>'contract_amount')::numeric,
   (value->>'withholding_tax_rate')::numeric,
   value->>'duration',
   value->>'status',
   p_actor,
   p_actor
  ) returning * into project;
  insert into public.gmea_partners(id,project_id,data) values
   (gen_random_uuid(),project.id,'{"name":"Eng. Ruel Dumaguit","percentage":50,"sort_order":0}'),
   (gen_random_uuid(),project.id,'{"name":"Sir Edward","percentage":50,"sort_order":1}');
  return project.id;
 end if;

 select * into project
 from public.gmea_projects
 where id=p_project
 for update;
 if not found then raise exception 'Project not found'; end if;
 if p_version is distinct from project.version then
  raise exception 'This project changed. Reload the page before saving again.';
 end if;
 if project.status='archived' and kind<>'project' then
  raise exception 'Restore this project before editing financial records';
 end if;

 if kind='project' then
  update public.gmea_projects set
   name=value->>'name',
   client=value->>'client',
   location=value->>'location',
   contract_amount=(value->>'contract_amount')::numeric,
   withholding_tax_rate=(value->>'withholding_tax_rate')::numeric,
   duration=value->>'duration',
   status=value->>'status'
  where id=p_project;
 elsif kind='partners' then
  delete from public.gmea_partners where project_id=p_project;
  for entry in select * from jsonb_array_elements(value) loop
   insert into public.gmea_partners(id,project_id,data)
   values(
    (entry->>'id')::uuid,
    p_project,
    (entry-'id') || jsonb_build_object('sort_order',position)
   );
   position:=position+1;
  end loop;
 elsif kind='expense' then
  target_id:=(value->>'id')::uuid;
  insert into public.gmea_expenses(id,project_id,data)
  values(target_id,p_project,value-'id')
  on conflict(id) do update
   set data=excluded.data,updated_at=now()
   where gmea_expenses.project_id=p_project;
  get diagnostics affected=row_count;
  if affected=0 then raise exception 'Entry does not belong to this project'; end if;

  insert into public.gmea_expense_options(field,value)
  select option_field,btrim(option_value)
  from (values
   ('supplier',value->>'supplier'),
   ('method',value->>'method'),
   ('invoice_name',value->>'invoice_name')
  ) as options(option_field,option_value)
  where btrim(coalesce(option_value,''))<>''
  on conflict do nothing;
 elsif kind='delete' and p_command->>'entity'='expense' then
  target_id:=(p_command->>'id')::uuid;
  delete from public.gmea_expenses
  where id=target_id and project_id=p_project;
  if not found then raise exception 'Entry cannot be removed'; end if;
 else
  raise exception 'Invalid operation';
 end if;

 update public.gmea_projects set
  version=version+1,
  updated_at=now(),
  updated_by=p_actor
 where id=p_project;
 return p_project;
end $$;

revoke all on function public.mutate_gmea_project(uuid,uuid,integer,jsonb)
 from public,anon,authenticated;
grant execute on function public.mutate_gmea_project(uuid,uuid,integer,jsonb)
 to service_role;

commit;
