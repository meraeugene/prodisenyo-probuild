create extension if not exists pgcrypto with schema extensions;

create table if not exists public.app_users (
  id uuid primary key default extensions.gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'employee')),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists app_sessions_token_idx on public.app_sessions(token);
create index if not exists app_sessions_user_id_idx on public.app_sessions(user_id);

create table if not exists public.payroll_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  period_label text not null,
  period_start date not null,
  period_end date not null,
  month_label text not null,
  week_label text not null,
  site_scope text,
  total_employees integer not null default 0,
  total_hours numeric(12,2) not null default 0,
  total_pay numeric(12,2) not null default 0,
  saved_by uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint payroll_runs_saved_by_fkey
    foreign key (saved_by) references public.app_users(id) on delete restrict
);

create index if not exists payroll_runs_period_start_idx
  on public.payroll_runs(period_start desc);

create table if not exists public.payroll_run_items (
  id uuid primary key default extensions.gen_random_uuid(),
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  employee_name text not null,
  employee_role text not null,
  site text not null,
  hours_worked numeric(12,2) not null default 0,
  overtime_hours numeric(12,2) not null default 0,
  rate_per_day numeric(12,2) not null default 0,
  regular_pay numeric(12,2) not null default 0,
  overtime_pay numeric(12,2) not null default 0,
  total_pay numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists payroll_run_items_run_id_idx
  on public.payroll_run_items(payroll_run_id);

create or replace function public.verify_app_login(
  p_username text,
  p_password text
)
returns table (
  user_id uuid,
  username text,
  full_name text,
  role text,
  active boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select
    u.id,
    u.username,
    u.full_name,
    u.role,
    u.active
  from public.app_users u
  where lower(u.username) = lower(trim(p_username))
    and u.active = true
    and u.password_hash = extensions.crypt(p_password, u.password_hash)
  limit 1;
end;
$$;
