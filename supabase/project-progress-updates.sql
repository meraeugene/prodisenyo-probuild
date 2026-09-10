begin;

create table if not exists public.project_progress_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  overall_percent numeric(5,2) not null check (overall_percent >= 0 and overall_percent <= 100),
  completed_work_summary text not null check (char_length(trim(completed_work_summary)) between 1 and 1000),
  remarks text check (remarks is null or char_length(remarks) <= 600),
  progress_date date not null default (timezone('Asia/Manila', now()))::date,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.project_progress_updates
  add column if not exists progress_date date;

update public.project_progress_updates
set progress_date = (timezone('Asia/Manila', created_at))::date
where progress_date is null;

alter table public.project_progress_updates
  alter column progress_date set default (timezone('Asia/Manila', now()))::date,
  alter column progress_date set not null;

create index if not exists project_progress_updates_project_created_idx
  on public.project_progress_updates(project_id, created_at desc);

create index if not exists project_progress_updates_project_date_idx
  on public.project_progress_updates(project_id, progress_date desc, created_at desc);

alter table public.project_progress_updates enable row level security;

drop policy if exists "progress updates readable by project members" on public.project_progress_updates;
create policy "progress updates readable by project members"
  on public.project_progress_updates for select
  using (
    public.is_ceo()
    or exists (
      select 1 from public.projects projects
      where projects.id = project_progress_updates.project_id
        and (
          projects.assigned_engineer_id = auth.uid()
          or projects.assigned_estimate_engineer_id = auth.uid()
        )
    )
  );

drop policy if exists "progress updates created by assigned site engineer" on public.project_progress_updates;
create policy "progress updates created by assigned site engineer"
  on public.project_progress_updates for insert
  with check (
    submitted_by = auth.uid()
    and exists (
      select 1 from public.projects projects
      where projects.id = project_progress_updates.project_id
        and projects.assigned_engineer_id = auth.uid()
    )
  );

commit;
