do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'budget_project_type' and n.nspname = 'public'
  ) then
    create type public.budget_project_type as enum (
      'new_build',
      'renovation',
      'extension',
      'other'
    );
  end if;
end
$$;

alter type public.budget_project_type add value if not exists 'new_build';
alter type public.budget_project_type add value if not exists 'renovation';
alter type public.budget_project_type add value if not exists 'extension';
alter type public.budget_project_type add value if not exists 'other';

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'budget_item_status' and n.nspname = 'public'
  ) then
    create type public.budget_item_status as enum (
      'upcoming',
      'ongoing',
      'completed'
    );
  end if;
end
$$;

alter type public.budget_item_status add value if not exists 'upcoming';
alter type public.budget_item_status add value if not exists 'ongoing';
alter type public.budget_item_status add value if not exists 'completed';

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'budget_item_category' and n.nspname = 'public'
  ) then
    create type public.budget_item_category as enum (
      'materials',
      'labor',
      'equipment',
      'permits',
      'services',
      'utilities',
      'transportation',
      'miscellaneous'
    );
  end if;
end
$$;

alter type public.budget_item_category add value if not exists 'materials';
alter type public.budget_item_category add value if not exists 'labor';
alter type public.budget_item_category add value if not exists 'equipment';
alter type public.budget_item_category add value if not exists 'permits';
alter type public.budget_item_category add value if not exists 'services';
alter type public.budget_item_category add value if not exists 'utilities';
alter type public.budget_item_category add value if not exists 'transportation';
alter type public.budget_item_category add value if not exists 'miscellaneous';

create table if not exists public.budget_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  project_type public.budget_project_type,
  currency_code text not null default 'PHP',
  starting_budget numeric(14,2) not null default 0 check (starting_budget >= 0),
  is_archived boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.budget_projects(id) on delete cascade,
  name text not null,
  status public.budget_item_status not null default 'upcoming',
  category public.budget_item_category not null,
  estimated_cost numeric(14,2) not null default 0 check (estimated_cost >= 0),
  actual_spent numeric(14,2) not null default 0 check (actual_spent >= 0),
  notes text,
  sort_order integer not null default 0,
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists budget_projects_created_by_idx
  on public.budget_projects(created_by, created_at desc);

create index if not exists budget_projects_active_idx
  on public.budget_projects(is_archived, created_at desc);

create index if not exists budget_items_project_id_idx
  on public.budget_items(project_id);

create index if not exists budget_items_project_status_idx
  on public.budget_items(project_id, status, sort_order, created_at);

create index if not exists budget_items_project_category_idx
  on public.budget_items(project_id, category);

drop trigger if exists budget_projects_set_updated_at on public.budget_projects;
create trigger budget_projects_set_updated_at
before update on public.budget_projects
for each row execute function public.set_updated_at();

drop trigger if exists budget_items_set_updated_at on public.budget_items;
create trigger budget_items_set_updated_at
before update on public.budget_items
for each row execute function public.set_updated_at();

alter table public.budget_projects enable row level security;
alter table public.budget_items enable row level security;

drop policy if exists "budget projects readable by ceo" on public.budget_projects;
drop policy if exists "budget projects managed by ceo" on public.budget_projects;
drop policy if exists "budget items readable by ceo" on public.budget_items;
drop policy if exists "budget items managed by ceo" on public.budget_items;
drop policy if exists "budget projects readable by payroll managers and ceo" on public.budget_projects;
drop policy if exists "budget projects managed by payroll managers and ceo" on public.budget_projects;
drop policy if exists "budget items readable by payroll managers and ceo" on public.budget_items;
drop policy if exists "budget items managed by payroll managers and ceo" on public.budget_items;

create policy "budget projects readable by payroll managers and ceo"
  on public.budget_projects
  for select
  using (public.is_ceo() or public.is_payroll_manager());

create policy "budget projects managed by payroll managers and ceo"
  on public.budget_projects
  for all
  using (public.is_ceo() or public.is_payroll_manager())
  with check (public.is_ceo() or public.is_payroll_manager());

create policy "budget items readable by payroll managers and ceo"
  on public.budget_items
  for select
  using (public.is_ceo() or public.is_payroll_manager());

create policy "budget items managed by payroll managers and ceo"
  on public.budget_items
  for all
  using (public.is_ceo() or public.is_payroll_manager())
  with check (public.is_ceo() or public.is_payroll_manager());
