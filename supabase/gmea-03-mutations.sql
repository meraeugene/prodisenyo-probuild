begin;
create or replace function public.mutate_gmea_project(p_actor uuid,p_project uuid,p_version integer,p_command jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare
 project public.gmea_projects; kind text:=p_command->>'kind'; value jsonb:=p_command->'value';
 entry jsonb; target_id uuid; target_table text; quote public.gmea_quotations; position integer:=0; affected integer;
begin
 if not exists(select 1 from public.profiles where id=p_actor and role::text='gmea' and is_active) then
  raise exception 'Only active GMEA users can manage projects';
 end if;
 if p_project is null then
  if kind<>'project' then raise exception 'Create a project first'; end if;
  insert into public.gmea_projects(name,client,location,description,start_date,end_date,duration,status,created_by,updated_by)
   values(value->>'name',value->>'client',value->>'location',value->>'description',
    nullif(value->>'start_date','')::date,nullif(value->>'end_date','')::date,value->>'duration',value->>'status',p_actor,p_actor)
   returning * into project;
  insert into public.gmea_partners(id,project_id,data) values
   (gen_random_uuid(),project.id,'{"name":"Eng. Ruel Dumaguit","percentage":50,"sort_order":0}'),
   (gen_random_uuid(),project.id,'{"name":"Sir Edward","percentage":50,"sort_order":1}');
  return project.id;
 end if;
 select * into project from public.gmea_projects where id=p_project for update;
 if not found then raise exception 'Project not found'; end if;
 if p_version is distinct from project.version then raise exception 'This project changed. Reload the page before saving again.'; end if;
 if project.status='archived' and kind<>'project' then raise exception 'Restore this project before editing financial records'; end if;
 if kind='project' then
  update public.gmea_projects set name=value->>'name',client=value->>'client',location=value->>'location',
   description=value->>'description',start_date=nullif(value->>'start_date','')::date,
   end_date=nullif(value->>'end_date','')::date,duration=value->>'duration',status=value->>'status' where id=p_project;
 elsif kind='quotation' then
  target_id:=(value->>'id')::uuid;
  select * into quote from public.gmea_quotations where id=target_id;
  if found and (quote.project_id<>p_project or quote.status<>'draft') then raise exception 'Only this project draft can be edited'; end if;
  insert into public.gmea_quotations(id,project_id,status,total,data)
   values(target_id,p_project,'draft',(value->>'total')::numeric,value-'items'-'status'-'project_id'-'id')
   on conflict(id) do update set total=excluded.total,data=excluded.data,updated_at=now()
   where gmea_quotations.project_id=p_project and gmea_quotations.status='draft';
  get diagnostics affected=row_count;
  if affected=0 then raise exception 'Only this project draft can be edited'; end if;
  delete from public.gmea_quotation_items where quotation_id=target_id;
  for entry in select * from jsonb_array_elements(value->'items') loop
   insert into public.gmea_quotation_items(quotation_id,sort_order,description,unit,quantity,unit_price)
    values(target_id,position,entry->>'description',entry->>'unit',(entry->>'quantity')::numeric,(entry->>'unit_price')::numeric);
   position:=position+1;
  end loop;
 elsif kind='accept' then
  target_id:=(p_command->>'id')::uuid;
  select * into quote from public.gmea_quotations where id=target_id and project_id=p_project;
  if not found or quote.status<>'draft' then raise exception 'Select a saved draft quotation'; end if;
  update public.gmea_quotations set status='superseded',updated_at=now() where project_id=p_project and status='accepted';
  update public.gmea_quotations set status='accepted',updated_at=now() where id=target_id;
 elsif kind in ('milestones','partners') then
  target_table:=case kind when 'milestones' then 'gmea_milestones' else 'gmea_partners' end;
  if kind='milestones' and exists(
   select 1 from public.gmea_receipts r where r.project_id=p_project and nullif(r.data->>'milestone_id','') is not null
   and not exists(select 1 from jsonb_array_elements(value) v where v->>'id'=r.data->>'milestone_id')
  ) then raise exception 'A milestone with receipts cannot be removed'; end if;
  execute format('delete from public.%I where project_id=$1',target_table) using p_project;
  for entry in select * from jsonb_array_elements(value) loop
   execute format('insert into public.%I(id,project_id,data) values($1,$2,$3)',target_table)
    using (entry->>'id')::uuid,p_project,(entry-'id') || jsonb_build_object('sort_order',position);
   position:=position+1;
  end loop;
 elsif kind in ('receipt','expense') then
  target_id:=(value->>'id')::uuid;
  target_table:=case kind when 'receipt' then 'gmea_receipts' else 'gmea_expenses' end;
  if kind='receipt' and nullif(value->>'milestone_id','') is not null and not exists(
   select 1 from public.gmea_milestones where id=(value->>'milestone_id')::uuid and project_id=p_project
  ) then raise exception 'Milestone does not belong to this project'; end if;
  execute format('insert into public.%I(id,project_id,data) values($1,$2,$3)
   on conflict(id) do update set data=excluded.data,updated_at=now() where %I.project_id=$2',target_table,target_table)
   using target_id,p_project,value-'id';
  get diagnostics affected=row_count;
  if affected=0 then raise exception 'Entry does not belong to this project'; end if;
 elsif kind='delete' then
  target_id:=(p_command->>'id')::uuid;
  case p_command->>'entity'
   when 'quotation' then delete from public.gmea_quotations where id=target_id and project_id=p_project and status='draft';
   when 'receipt' then delete from public.gmea_receipts where id=target_id and project_id=p_project;
   when 'expense' then delete from public.gmea_expenses where id=target_id and project_id=p_project;
   else raise exception 'Invalid entry';
  end case;
  if not found then raise exception 'Entry cannot be removed'; end if;
 else raise exception 'Invalid operation';
 end if;
 update public.gmea_projects set version=version+1,updated_at=now(),updated_by=p_actor where id=p_project;
 return p_project;
end $$;
revoke all on function public.mutate_gmea_project(uuid,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.mutate_gmea_project(uuid,uuid,integer,jsonb) to service_role;
commit;
