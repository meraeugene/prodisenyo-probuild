begin;
create table if not exists public.gmea_operation_expenses (
  id uuid primary key,
  date date not null,
  category text not null check(category in ('Transportation','Water','Salary','Electricity')),
  description text not null check(length(btrim(description)) between 1 and 1000),
  amount numeric(14,2) not null check(amount>0 and amount<=10000000000),
  payee text not null default '' check(length(payee)<=200),
  method text not null default '' check(length(method)<=100),
  reference text not null default '' check(length(reference)<=100),
  notes text not null default '' check(length(notes)<=1000),
  version integer not null default 1 check(version>0),
  created_by uuid not null references public.profiles(id),
  updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists gmea_operation_expenses_date on public.gmea_operation_expenses(date,category);
alter table public.gmea_operation_expenses enable row level security;
revoke all on public.gmea_operation_expenses from anon,authenticated;
grant select on public.gmea_operation_expenses to authenticated;
grant all on public.gmea_operation_expenses to service_role;
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='gmea_operation_expenses' and policyname='gmea_operation_expenses_read') then
    create policy gmea_operation_expenses_read on public.gmea_operation_expenses for select to authenticated
      using(exists(select 1 from public.profiles where id=auth.uid() and is_active and role::text in ('gmea','ceo')));
  end if;
end $$;
commit;
notify pgrst, 'reload schema';
