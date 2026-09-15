begin;

-- SQL time cannot retain the biometric device's trailing "+" marker.
-- Store it separately so 00:32+ stays attached to the work date.
alter table public.attendance_records
  add column if not exists is_next_day boolean not null default false;

-- Repair legacy OT OUT punches whose "+" was previously stripped and whose
-- date was advanced by the old parser. The same import and employee/raw alias
-- must have an IN punch on the immediately preceding date.
with legacy_next_day_outs as (
  select candidate.id
  from public.attendance_records candidate
  where candidate.is_next_day = false
    and candidate.log_source = 'OT'
    and candidate.log_type = 'OUT'
    and candidate.log_time < time '06:00'
    and exists (
      select 1
      from public.attendance_records prior
      where prior.import_id = candidate.import_id
        and prior.log_date = candidate.log_date - 1
        and prior.log_type = 'IN'
        and (
          (
            candidate.employee_id is not null
            and prior.employee_id = candidate.employee_id
          )
          or (
            candidate.employee_id is null
            and prior.employee_id is null
            and prior.normalized_biometric_name =
              candidate.normalized_biometric_name
          )
        )
    )
)
update public.attendance_records attendance
set
  log_date = attendance.log_date - 1,
  is_next_day = true
from legacy_next_day_outs
where attendance.id = legacy_next_day_outs.id;

notify pgrst, 'reload schema';
commit;
