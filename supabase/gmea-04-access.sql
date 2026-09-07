-- Only tables whose existing migrations grant reads to every authenticated user.
-- Existing roles retain their current policies; this adds an exclusion for GMEA only.
begin;
do $$
declare table_name text;
begin
 foreach table_name in array array[
  'sites','employees','attendance_imports','attendance_records','role_rates','employee_branch_rates',
  'payroll_runs','payroll_run_items','payroll_run_daily_totals','payroll_adjustments','overtime_requests',
  'employee_work_schedules','payroll_holidays','employee_leave_records','payroll_attendance_days'
 ] loop
  if to_regclass('public.'||table_name) is not null then
   execute format('drop policy if exists exclude_gmea_read on public.%I',table_name);
   execute format('create policy exclude_gmea_read on public.%I as restrictive for select to authenticated
    using(coalesce(public.current_app_role()::text, '''') <> ''gmea'')',table_name);
  end if;
 end loop;
end $$;
-- Only a GMEA profile is guarded; existing account management uses service_role.
create or replace function public.guard_gmea_profile()
returns trigger language plpgsql set search_path=public as $$
begin
 if old.role::text='gmea' and current_user not in ('postgres','service_role','supabase_admin')
  and (new.role is distinct from old.role or new.is_active is distinct from old.is_active or new.id is distinct from old.id) then
  raise exception 'GMEA account privileges can only be changed through user management';
 end if;
 return new;
end $$;
drop trigger if exists guard_gmea_profile on public.profiles;
create trigger guard_gmea_profile before update on public.profiles for each row
 when (old.role::text='gmea') execute function public.guard_gmea_profile();
commit;

