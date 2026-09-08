-- Contract-specific payment terms and append-only receipt history.
-- Safe to run after gmea-01 through gmea-04 on new or existing environments.
begin;

update public.gmea_collections
set data=data || jsonb_build_object(
  'value_mode',coalesce(nullif(data->>'value_mode',''),'fixed'),
  'percentage',case
    when data->>'value_mode'='percentage' then data->'percentage'
    else 'null'::jsonb
  end,
  'notes',coalesce(data->>'notes','')
);

create table if not exists public.gmea_collection_receipts (
  id uuid primary key,  
  project_id uuid not null references public.gmea_projects(id) on delete cascade,
  term_id uuid not null references public.gmea_collections(id) on delete restrict,
  amount numeric(16,2) not null check(amount > 0),
  received_date date not null,
  method text not null default '',
  reference_number text not null default '',
  notes text not null default '',
  status text not null default 'posted' check(status in ('posted','voided')),
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  voided_by uuid references public.profiles(id) on delete restrict,
  voided_at timestamptz,
  void_reason text not null default '',
  constraint gmea_receipt_void_audit check(
    (status='posted' and voided_by is null and voided_at is null and void_reason='') or
    (status='voided' and voided_by is not null and voided_at is not null and length(btrim(void_reason))>0)
  )
);

create index if not exists gmea_receipts_project_idx
  on public.gmea_collection_receipts(project_id,received_date,recorded_at);
create index if not exists gmea_receipts_term_idx
  on public.gmea_collection_receipts(term_id,status);

alter table public.gmea_collection_receipts enable row level security;
revoke all on public.gmea_collection_receipts from anon,authenticated;
grant select on public.gmea_collection_receipts to authenticated;
grant all on public.gmea_collection_receipts to service_role;
drop policy if exists gmea_read on public.gmea_collection_receipts;
create policy gmea_read on public.gmea_collection_receipts
  for select to authenticated using(public.can_read_gmea());

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
  details jsonb;
  contract jsonb;
  entry jsonb;
  target_id uuid;
  target_term public.gmea_collections;
  target_receipt public.gmea_collection_receipts;
  position integer:=0;
  affected integer;
  is_new_expense boolean;
  received_total numeric(16,2);
  scheduled_total numeric(16,2);
  term_count integer;
begin
  if not exists(
    select 1 from public.profiles
    where id=p_actor and role::text='gmea' and is_active
  ) then
    raise exception 'Only active GMEA users can manage projects';
  end if;

  if p_project is null then
    if kind<>'create_project' then raise exception 'Create a project first'; end if;
    details:=value->'details';
    contract:=value->'contract';
    select count(*),coalesce(sum((term->>'amount')::numeric),0)
    into term_count,scheduled_total
    from jsonb_array_elements(contract->'payment_terms') term;
    if term_count not between 1 and 30 then
      raise exception 'A contract requires between 1 and 30 payment terms';
    end if;
    if (contract->>'contract_amount')::numeric<=0
      or scheduled_total<>(contract->>'contract_amount')::numeric then
      raise exception 'Payment terms must total the contract amount';
    end if;
    insert into public.gmea_projects(
      name,client,location,contract_amount,duration,created_by,updated_by
    ) values(
      details->>'name',
      details->>'client',
      details->>'location',
      (contract->>'contract_amount')::numeric,
      details->>'duration',
      p_actor,
      p_actor
    ) returning * into project;
    insert into public.gmea_partners(id,project_id,data) values
      (gen_random_uuid(),project.id,'{"name":"Eng. Ruel Dumaguit","percentage":50,"sort_order":0}'),
      (gen_random_uuid(),project.id,'{"name":"Sir Edward","percentage":50,"sort_order":1}');
    for entry in select * from jsonb_array_elements(contract->'payment_terms') loop
      insert into public.gmea_collections(id,project_id,data)
      values(
        (entry->>'id')::uuid,
        project.id,
        (entry-'id') || jsonb_build_object('sort_order',position)
      );
      position:=position+1;
    end loop;
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

  if kind='project_details' then
    update public.gmea_projects set
      name=value->>'name',
      client=value->>'client',
      location=value->>'location',
      duration=value->>'duration'
    where id=p_project;
  elsif kind='contract_terms' then
    select count(*),coalesce(sum((term->>'amount')::numeric),0)
    into term_count,scheduled_total
    from jsonb_array_elements(value->'payment_terms') term;
    if term_count not between 1 and 30 then
      raise exception 'A contract requires between 1 and 30 payment terms';
    end if;
    if (value->>'contract_amount')::numeric<=0
      or scheduled_total<>(value->>'contract_amount')::numeric then
      raise exception 'Payment terms must total the contract amount';
    end if;
    if exists(
      select 1
      from public.gmea_collections collection
      where collection.project_id=p_project
        and exists(
          select 1 from public.gmea_collection_receipts receipt
          where receipt.term_id=collection.id
        )
        and not exists(
          select 1
          from jsonb_array_elements(value->'payment_terms') proposed
          where (proposed->>'id')::uuid=collection.id
        )
    ) then
      raise exception 'A payment term with receipt history cannot be deleted';
    end if;

    for entry in select * from jsonb_array_elements(value->'payment_terms') loop
      target_id:=(entry->>'id')::uuid;
      select coalesce(sum(amount),0) into received_total
      from public.gmea_collection_receipts
      where term_id=target_id and project_id=p_project and status='posted';
      if (entry->>'amount')::numeric < received_total then
        raise exception 'A payment term cannot be reduced below its received amount';
      end if;
      insert into public.gmea_collections(id,project_id,data)
      values(
        target_id,
        p_project,
        (entry-'id') || jsonb_build_object('sort_order',position)
      )
      on conflict(id) do update
        set data=excluded.data,updated_at=now()
        where gmea_collections.project_id=p_project;
      get diagnostics affected=row_count;
      if affected=0 then raise exception 'Payment term does not belong to this project'; end if;
      position:=position+1;
    end loop;
    delete from public.gmea_collections collection
    where collection.project_id=p_project
      and not exists(
        select 1
        from jsonb_array_elements(value->'payment_terms') proposed
        where (proposed->>'id')::uuid=collection.id
      );
    update public.gmea_projects
    set contract_amount=(value->>'contract_amount')::numeric
    where id=p_project;
  elsif kind='record_receipt' then
    target_id:=(value->>'term_id')::uuid;
    select * into target_term
    from public.gmea_collections
    where id=target_id and project_id=p_project
    for update;
    if not found then raise exception 'Payment term not found'; end if;
    select coalesce(sum(amount),0) into received_total
    from public.gmea_collection_receipts
    where term_id=target_id and status='posted';
    if received_total+(value->>'amount')::numeric > (target_term.data->>'amount')::numeric then
      raise exception 'Receipt amount exceeds the payment term balance';
    end if;
    if (value->>'received_date')::date > current_date then
      raise exception 'Receipt date cannot be in the future';
    end if;
    insert into public.gmea_collection_receipts(
      id,project_id,term_id,amount,received_date,method,
      reference_number,notes,recorded_by
    ) values(
      (value->>'id')::uuid,
      p_project,
      target_id,
      (value->>'amount')::numeric,
      (value->>'received_date')::date,
      coalesce(value->>'method',''),
      coalesce(value->>'reference_number',''),
      coalesce(value->>'notes',''),
      p_actor
    );
  elsif kind='void_receipt' then
    target_id:=(p_command->>'receipt_id')::uuid;
    select * into target_receipt
    from public.gmea_collection_receipts
    where id=target_id and project_id=p_project
    for update;
    if not found then raise exception 'Receipt not found'; end if;
    if target_receipt.status<>'posted' then raise exception 'Receipt is already voided'; end if;
    update public.gmea_collection_receipts set
      status='voided',
      voided_by=p_actor,
      voided_at=now(),
      void_reason=p_command->>'reason'
    where id=target_id;
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

commit;
