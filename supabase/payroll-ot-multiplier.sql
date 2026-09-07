alter table public.employee_branch_rates
  add column if not exists overtime_multiplier numeric(6,4) not null default 1.25;

alter table public.payroll_run_items
  add column if not exists overtime_multiplier numeric(6,4) not null default 1.25;

alter table public.employee_branch_rates
  drop constraint if exists employee_branch_rates_overtime_multiplier_check;

alter table public.employee_branch_rates
  add constraint employee_branch_rates_overtime_multiplier_check
  check (overtime_multiplier > 0 and overtime_multiplier <= 5);

alter table public.payroll_run_items
  drop constraint if exists payroll_run_items_overtime_multiplier_check;

alter table public.payroll_run_items
  add constraint payroll_run_items_overtime_multiplier_check
  check (overtime_multiplier > 0 and overtime_multiplier <= 5);

notify pgrst, 'reload schema';
