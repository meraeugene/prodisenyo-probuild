begin;

-- Full system data reset.
-- Clears cost estimator, budget tracker, payroll, attendance,
-- employee/profile data, audit logs, and Supabase auth users.
truncate table public.project_estimate_items restart identity cascade;
truncate table public.project_estimates restart identity cascade;
truncate table public.cost_catalog_items restart identity cascade;
truncate table public.budget_items restart identity cascade;
truncate table public.budget_projects restart identity cascade;
truncate table public.audit_logs restart identity cascade;
truncate table public.payroll_adjustments restart identity cascade;
truncate table public.payroll_run_items restart identity cascade;
truncate table public.payroll_runs restart identity cascade;
truncate table public.employee_branch_rates restart identity cascade;
truncate table public.attendance_records restart identity cascade;
truncate table public.attendance_imports restart identity cascade;
truncate table public.role_rates restart identity cascade;
truncate table public.employees restart identity cascade;
truncate table public.sites restart identity cascade;
truncate table public.profiles restart identity cascade;
delete from auth.users;

commit;
