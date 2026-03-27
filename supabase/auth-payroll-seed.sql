insert into public.app_users (username, password_hash, full_name, role)
values
  (
    'admin1',
    extensions.crypt('Admin123!', extensions.gen_salt('bf')),
    'Payroll Admin One',
    'admin'
  ),
  (
    'admin2',
    extensions.crypt('Admin456!', extensions.gen_salt('bf')),
    'Payroll Admin Two',
    'admin'
  ),
  (
    'employee1',
    extensions.crypt('Employee123!', extensions.gen_salt('bf')),
    'Payroll Employee',
    'employee'
  )
on conflict (username) do update
set
  password_hash = excluded.password_hash,
  full_name = excluded.full_name,
  role = excluded.role,
  active = true;
