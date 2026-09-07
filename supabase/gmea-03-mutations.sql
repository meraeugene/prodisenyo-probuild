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
 is_new_expense boolean;
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
   name,client,location,contract_amount,duration,created_by,updated_by
  ) values(
   value->>'name',
   value->>'client',
   value->>'location',
   (value->>'contract_amount')::numeric,
   value->>'duration',
   p_actor,
   p_actor
  ) returning * into project;
  insert into public.gmea_partners(id,project_id,data) values
   (gen_random_uuid(),project.id,'{"name":"Eng. Ruel Dumaguit","percentage":50,"sort_order":0}'),
   (gen_random_uuid(),project.id,'{"name":"Sir Edward","percentage":50,"sort_order":1}');
  insert into public.gmea_collections(id,project_id,data) values
   (gen_random_uuid(),project.id,jsonb_build_object(
    'description','Down payment of the contract 80%',
    'amount',round(project.contract_amount*.8,2),
    'notes','',
    'sort_order',0
   )),
   (gen_random_uuid(),project.id,jsonb_build_object(
    'description','Completion and final turn over 20%',
    'amount',project.contract_amount-round(project.contract_amount*.8,2),
    'notes','',
    'sort_order',1
   ));
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
 if kind='delete_project' then
  delete from public.gmea_projects where id=p_project;
  return p_project;
 end if;

 if kind='project' then
  update public.gmea_projects set
   name=value->>'name',
   client=value->>'client',
   location=value->>'location',
   contract_amount=(value->>'contract_amount')::numeric,
   duration=value->>'duration'
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
  select not exists(
   select 1 from public.gmea_expenses where id=target_id
  ) into is_new_expense;
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

  if is_new_expense then
   insert into public.gmea_expense_notifications(
    expense_id,project_id,recipient_id
   )
   select target_id,p_project,id
   from public.profiles
   where role::text='ceo' and is_active
   on conflict(expense_id,recipient_id) do nothing;
  end if;
 elsif kind='collections' then
  delete from public.gmea_collections where project_id=p_project;
  for entry in select * from jsonb_array_elements(value) loop
   insert into public.gmea_collections(id,project_id,data)
   values(
    (entry->>'id')::uuid,
    p_project,
    (entry-'id') || jsonb_build_object('sort_order',position)
   );
   position:=position+1;
  end loop;
 elsif kind='delete' and p_command->>'entity'='expense' then
  target_id:=(p_command->>'id')::uuid;
  delete from public.gmea_expenses where id=target_id and project_id=p_project;
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

create or replace function public.mark_gmea_expense_viewed(
 p_actor uuid,
 p_project uuid,
 p_expense uuid
)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(
  select 1 from public.profiles
  where id=p_actor and role::text='ceo' and is_active
 ) then
  raise exception 'Only an active CEO can view this notification';
 end if;
 if not exists(
  select 1 from public.gmea_expenses
  where id=p_expense and project_id=p_project
 ) then
  raise exception 'Expense not found';
 end if;
 update public.gmea_expense_notifications
 set read_at=coalesce(read_at,now())
 where expense_id=p_expense and project_id=p_project and recipient_id=p_actor;
end $$;

revoke all on function public.mark_gmea_expense_viewed(uuid,uuid,uuid)
 from public,anon,authenticated;
grant execute on function public.mark_gmea_expense_viewed(uuid,uuid,uuid)
 to service_role;

commit;
