begin;

create table if not exists public.employee_biometric_aliases (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  raw_alias text not null,
  normalized_alias text not null,
  match_source text not null check (
    match_source in (
      'EXACT_NAME', 'EXISTING_ALIAS', 'REFERENCE_PDF', 'MANUAL',
      'NORMALIZED_MATCH'
    )
  ),
  confidence numeric(5,4) check (
    confidence is null or (confidence >= 0 and confidence <= 1)
  ),
  confirmed boolean not null default false,
  confirmed_by uuid references public.profiles(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (nullif(trim(raw_alias), '') is not null),
  check (nullif(trim(normalized_alias), '') is not null),
  check (not confirmed or confirmed_at is not null)
);

create unique index if not exists employee_biometric_aliases_normalized_idx
  on public.employee_biometric_aliases(normalized_alias);
create index if not exists employee_biometric_aliases_employee_idx
  on public.employee_biometric_aliases(employee_id, confirmed);

alter table public.attendance_records
  add column if not exists raw_biometric_name text,
  add column if not exists normalized_biometric_name text,
  add column if not exists match_status text not null default 'UNMATCHED',
  add column if not exists match_source text;

alter table public.attendance_records
  drop constraint if exists attendance_records_match_status_check;
alter table public.attendance_records
  add constraint attendance_records_match_status_check check (
    match_status in ('MATCHED', 'NEEDS_REVIEW', 'UNMATCHED')
  );
alter table public.attendance_records
  drop constraint if exists attendance_records_match_source_check;
alter table public.attendance_records
  add constraint attendance_records_match_source_check check (
    match_source is null or match_source in (
      'EXACT_NAME', 'EXISTING_ALIAS', 'REFERENCE_PDF', 'MANUAL',
      'NORMALIZED_MATCH'
    )
  );

update public.attendance_records
set
  raw_biometric_name = coalesce(raw_biometric_name, employee_name),
  normalized_biometric_name = case
    when coalesce(raw_biometric_name, employee_name) ~ '^[lsep][A-Z][a-z]'
      then trim(regexp_replace(
        lower(regexp_replace(
          coalesce(raw_biometric_name, employee_name),
          '^([lsep])([A-Z][a-z])',
          '\1 \2'
        )),
        '[^a-z0-9]+', ' ', 'g'
      ))
    else coalesce(
      normalized_biometric_name,
      trim(regexp_replace(
        lower(coalesce(raw_biometric_name, employee_name)),
        '[^a-z0-9]+', ' ', 'g'
      ))
    )
  end;

alter table public.attendance_records
  alter column raw_biometric_name set not null,
  alter column normalized_biometric_name set not null;

drop trigger if exists employee_biometric_aliases_set_updated_at
  on public.employee_biometric_aliases;
create trigger employee_biometric_aliases_set_updated_at
  before update on public.employee_biometric_aliases
  for each row execute function public.set_updated_at();

alter table public.employee_biometric_aliases enable row level security;
drop policy if exists "biometric aliases readable by authenticated users"
  on public.employee_biometric_aliases;
create policy "biometric aliases readable by authenticated users"
  on public.employee_biometric_aliases for select
  using (auth.role() = 'authenticated');
drop policy if exists "biometric aliases managed by payroll managers and ceo"
  on public.employee_biometric_aliases;
create policy "biometric aliases managed by payroll managers and ceo"
  on public.employee_biometric_aliases for all
  using (public.is_ceo() or public.is_payroll_manager())
  with check (public.is_ceo() or public.is_payroll_manager());

-- Explicitly approved canonical-roster initialization. These are employee
-- identities from the active full-name roster, not names inferred from punch
-- files. Existing employee rows remain authoritative and are never overwritten.
with approved_active_employees(full_name) as (
  values
    ('Adam Taer'),
    ('Aidan Tundag'),
    ('Angelo Sabocdalao'),
    ('Arlendo Mercado'),
    ('Arruelle Paisones'),
    ('Ben Cuizon'),
    ('Bernie Sabayanan'),
    ('Brian Louis Paisones'),
    ('Bryan Cabelita'),
    ('Bryan Hugo'),
    ('Dominador Paquit'),
    ('Eden Anggano'),
    ('Eduardo Brigole Jr'),
    ('Eduardo Brigole Sr'),
    ('Ely Sabayanan'),
    ('Eric Gamayon'),
    ('Faith Mark Jarlata'),
    ('Felizardo Lauron'),
    ('Francisco Yuag'),
    ('Gibson Dialon'),
    ('Gilbert Cabigquez'),
    ('Henry Lacbayo'),
    ('James Belarmino'),
    ('Jayrald Delocado'),
    ('Jebrille Saddal'),
    ('Jereck Gamayon'),
    ('Jerico Ebol'),
    ('Jimmy Pontillas'),
    ('Joemar Demadara'),
    ('John Estrada'),
    ('John Lester Pedroso'),
    ('John Mark Cahapon'),
    ('Jonald Ocariza'),
    ('Jose Subingsubing'),
    ('Joseph Canete'),
    ('Julito Ochia Jr'),
    ('Junriel Rebalde'),
    ('Kent Barricante'),
    ('Kim Nolmer Sario'),
    ('Lemuel Baltonado'),
    ('Luceno Ranara'),
    ('Manuel Mangubat'),
    ('Marcelo Baticaros'),
    ('Marcial Gerona'),
    ('Mariegen Gersamio'),
    ('Mark John Iduzma'),
    ('Marlou Margate'),
    ('Mike Gerona'),
    ('Neil Capillanes'),
    ('Nelson Cuyno'),
    ('Nov Ryan Warguez'),
    ('Oliver Lopez'),
    ('Patrick Lorico'),
    ('Patrino Ubod'),
    ('Pedro Mantos'),
    ('Pedro Tatoy Sr'),
    ('Primo Tapdasan'),
    ('Raymond Baticaros'),
    ('Remark Naranjo'),
    ('Renante Guimba'),
    ('Reydel Guergio'),
    ('Richie Pimentel'),
    ('Roberto Gabisay'),
    ('Rodel Hawinay'),
    ('Rodel Yana'),
    ('Rodolfo Quinompot'),
    ('Roland Pimentel'),
    ('Rolly Pimentel'),
    ('Ronald Maglasang'),
    ('Rudy Ango'),
    ('Ryan Bandin'),
    ('Ryan Warguez'),
    ('Saldie Pimentel'),
    ('Sam Tamayo'),
    ('Sanny Aguid Jr'),
    ('Sanny Aguid Sr'),
    ('Shawn Pacto'),
    ('Vicente Cabigquez'),
    ('Vincent Subingsubing'),
    ('Violito Warguez'),
    ('Welo Cabileta'),
    ('Winnie Pimentel'),
    ('Yoyong Lacbayo')
)
insert into public.employees (full_name)
select roster.full_name
from approved_active_employees roster
where not exists (
  select 1
  from public.employees employee
  where lower(trim(employee.full_name)) = lower(trim(roster.full_name))
);

-- High-confidence rows, the user's requested likely-name merges, and explicit
-- demo aliases are confirmed only when the canonical full name resolves to
-- exactly one existing employee. This never creates an employee from PDF data
-- and never replaces a conflicting mapping an administrator already confirmed.
with high_confidence_aliases(raw_alias, normalized_alias, full_name) as (
  values
    ('Ely S', 'ely s', 'Ely Sabayanan'),
    ('Yuag', 'yuag', 'Francisco Yuag'),
    ('Ranara', 'ranara', 'Luceno Ranara'),
    ('Jarlata', 'jarlata', 'Faith Mark Jarlata'),
    ('Roland P', 'roland p', 'Roland Pimentel'),
    ('Marcial', 'marcial', 'Marcial Gerona'),
    ('Vicent C', 'vicent c', 'Vicente Cabigquez'),
    ('Joseph C', 'joseph c', 'Joseph Canete'),
    ('Eduardo Jr', 'eduardo jr', 'Eduardo Brigole Jr'),
    ('Mariegen', 'mariegen', 'Mariegen Gersamio'),
    ('Jcahapon', 'jcahapon', 'John Mark Cahapon'),
    ('Richie', 'richie', 'Richie Pimentel'),
    ('Fore Neil', 'fore neil', 'Neil Capillanes'),
    ('E Welo', 'e welo', 'Welo Cabileta'),
    ('Skilled Vicente C', 'skilled vicente c', 'Vicente Cabigquez'),
    ('Elec Nov Ryan W', 'elec nov ryan w', 'Nov Ryan Warguez'),
    ('Skilled Bernie', 'skilled bernie', 'Bernie Sabayanan'),
    ('Skilled Adam', 'skilled adam', 'Adam Taer'),
    ('Skilled Gilbert', 'skilled gilbert', 'Gilbert Cabigquez'),
    ('Labor Jayrald', 'labor jayrald', 'Jayrald Delocado'),
    ('Elec Nelson', 'elec nelson', 'Nelson Cuyno'),
    ('Installer Ranara', 'installer ranara', 'Luceno Ranara'),
    ('Elec Cabelita B', 'elec cabelita b', 'Bryan Cabelita'),
    ('Elec Yuag', 'elec yuag', 'Francisco Yuag'),
    ('Labor Roberto', 'labor roberto', 'Roberto Gabisay'),
    ('P Aidan T', 'p aidan t', 'Aidan Tundag'),
    ('Pa Ronald M', 'pa ronald m', 'Ronald Maglasang'),
    ('S Primo T', 's primo t', 'Primo Tapdasan'),
    ('Patrick L', 'patrick l', 'Patrick Lorico'),
    ('Junriel', 'junriel', 'Junriel Rebalde'),
    ('S Francis Y', 's francis y', 'Francisco Yuag'),
    ('Yoyon', 'yoyon', 'Yoyong Lacbayo'),
    ('Doming', 'doming', 'Dominador Paquit'),
    ('Skilled Jomar', 'skilled jomar', 'Joemar Demadara'),
    ('Welder Domeng', 'welder domeng', 'Dominador Paquit'),
    ('Engr Patrick', 'engr patrick', 'Patrick Lorico'),
    ('E Patrick', 'e patrick', 'Patrick Lorico'),
    ('Roland Pimentel', 'roland pimentel', 'Roland Pimentel'),
    ('Pimentel Roland', 'pimentel roland', 'Roland Pimentel'),
    ('S Pimentel Roland', 's pimentel roland', 'Roland Pimentel'),
    ('Skilled Roland Pimentel', 'skilled roland pimentel', 'Roland Pimentel'),
    ('S Taer Adam', 's taer adam', 'Adam Taer'),
    ('Jonald Okariza', 'jonald okariza', 'Jonald Ocariza'),
    ('S Ocariza Jonald', 's ocariza jonald', 'Jonald Ocariza'),
    ('Skilled Jonald O', 'skilled jonald o', 'Jonald Ocariza'),
    ('L Gabisay Roberto', 'l gabisay roberto', 'Roberto Gabisay'),
    ('S Subingsubing Jose', 's subingsubing jose', 'Jose Subingsubing'),
    ('D Naranjo Remark', 'd naranjo remark', 'Remark Naranjo'),
    ('L Subingsubing Vincent', 'l subingsubing vincent', 'Vincent Subingsubing'),
    ('S Hawinay Rodel', 's hawinay rodel', 'Rodel Hawinay'),
    ('L Mangubat Manuel', 'l mangubat manuel', 'Manuel Mangubat'),
    ('S Ranara Luceno', 's ranara luceno', 'Luceno Ranara')
),
canonical_employees as (
  select lower(trim(full_name)) as name_key, min(id::text)::uuid as employee_id
  from public.employees
  group by lower(trim(full_name))
  having count(*) = 1
)
insert into public.employee_biometric_aliases (
  employee_id, raw_alias, normalized_alias, match_source, confidence,
  confirmed, confirmed_at
)
select
  employee.employee_id, alias.raw_alias, alias.normalized_alias,
  'REFERENCE_PDF', 0.9500, true, timezone('utc', now())
from high_confidence_aliases alias
join canonical_employees employee
  on employee.name_key = lower(alias.full_name)
on conflict (normalized_alias) do update set
  employee_id = excluded.employee_id,
  raw_alias = excluded.raw_alias,
  match_source = excluded.match_source,
  confidence = excluded.confidence,
  confirmed = true,
  confirmed_at = coalesce(
    public.employee_biometric_aliases.confirmed_at,
    timezone('utc', now())
  ),
  updated_at = timezone('utc', now())
where not public.employee_biometric_aliases.confirmed
   or public.employee_biometric_aliases.employee_id = excluded.employee_id;

-- Example-only aliases that are not confirmed by the supplied reference remain
-- Resolve suggestions and carry no authoritative employee_id into attendance.
with review_aliases(raw_alias, normalized_alias, full_name, confidence) as (
  values
    ('PA Aidan', 'pa aidan', 'Aidan Tundag', 0.9000),
    ('lJereck', 'l jereck', 'Jereck Gamayon', 0.9000),
    ('labor jereck gamayon', 'labor jereck gamayon', 'Jereck Gamayon', 0.9500),
    ('jereck', 'jereck', 'Jereck Gamayon', 0.8500),
    ('Aguid Jr Sanny', 'aguid jr sanny', 'Sanny Aguid Jr', 0.9500),
    ('Angelo Saboclao', 'angelo saboclao', 'Angelo Sabocdalao', 0.8500)
),
canonical_employees as (
  select lower(trim(full_name)) as name_key, min(id::text)::uuid as employee_id
  from public.employees
  group by lower(trim(full_name))
  having count(*) = 1
)
insert into public.employee_biometric_aliases (
  employee_id, raw_alias, normalized_alias, match_source, confidence, confirmed
)
select
  employee.employee_id, alias.raw_alias, alias.normalized_alias,
  'REFERENCE_PDF', alias.confidence, false
from review_aliases alias
join canonical_employees employee
  on employee.name_key = lower(alias.full_name)
on conflict (normalized_alias) do nothing;

-- These aliases were explicitly confirmed by payroll in the implementation request.
-- Resolve by the proper canonical spelling, never by a hardcoded employee UUID.
with confirmed_aliases(raw_alias, normalized_alias, full_name) as (
  values
    ('s adam', 's adam', 'Adam Taer'),
    ('skilled adam', 'skilled adam', 'Adam Taer'),
    ('adam taer', 'adam taer', 'Adam Taer'),
    ('aidan', 'aidan', 'Aidan Tundag'),
    ('PA Aidan', 'pa aidan', 'Aidan Tundag'),
    ('P Aidan T', 'p aidan t', 'Aidan Tundag'),
    ('Aidan Tundag', 'aidan tundag', 'Aidan Tundag')
),
canonical_employees as (
  select full_name, min(id::text)::uuid as employee_id
  from public.employees
  where full_name in ('Adam Taer', 'Aidan Tundag')
  group by full_name
  having count(*) = 1
)
insert into public.employee_biometric_aliases (
  employee_id, raw_alias, normalized_alias, match_source, confidence,
  confirmed, confirmed_at
)
select
  employee.employee_id, alias.raw_alias, alias.normalized_alias, 'MANUAL', 1,
  true, timezone('utc', now())
from confirmed_aliases alias
join canonical_employees employee on employee.full_name = alias.full_name
on conflict (normalized_alias) do update set
  employee_id = excluded.employee_id,
  raw_alias = excluded.raw_alias,
  match_source = 'MANUAL',
  confidence = 1,
  confirmed = true,
  confirmed_at = coalesce(
    public.employee_biometric_aliases.confirmed_at,
    timezone('utc', now())
  ),
  updated_at = timezone('utc', now());

-- Older application builds stored likely candidate IDs before confirmation. Remove
-- those provisional links first so they cannot contaminate canonical UI groups.
update public.attendance_records
set
  employee_id = null,
  employee_name = raw_biometric_name
where match_status <> 'MATCHED';

-- Historical rows covered only by a review candidate stay visible, but do not
-- borrow the candidate employee ID until a payroll administrator confirms it.
update public.attendance_records attendance
set
  employee_id = null,
  employee_name = attendance.raw_biometric_name,
  match_status = 'NEEDS_REVIEW',
  match_source = 'REFERENCE_PDF'
from public.employee_biometric_aliases alias
where not alias.confirmed
  and attendance.normalized_biometric_name = alias.normalized_alias;

-- Reconcile all historical punches covered by a confirmed alias.
update public.attendance_records attendance
set
  employee_id = alias.employee_id,
  employee_name = employee.full_name,
  match_status = 'MATCHED',
  match_source = 'EXISTING_ALIAS'
from public.employee_biometric_aliases alias
join public.employees employee on employee.id = alias.employee_id
where alias.confirmed
  and attendance.normalized_biometric_name = alias.normalized_alias;

-- Reconcile unique exact canonical names that predate the alias system.
with unique_canonical_names as (
  select
    trim(regexp_replace(lower(full_name), '[^a-z0-9]+', ' ', 'g')) as name_key,
    min(id::text)::uuid as employee_id
  from public.employees
  group by trim(regexp_replace(lower(full_name), '[^a-z0-9]+', ' ', 'g'))
  having count(*) = 1
)
update public.attendance_records attendance
set
  employee_id = canonical.employee_id,
  employee_name = employee.full_name,
  match_status = 'MATCHED',
  match_source = 'EXACT_NAME'
from unique_canonical_names canonical
join public.employees employee on employee.id = canonical.employee_id
where attendance.normalized_biometric_name = canonical.name_key
  and not exists (
    select 1
    from public.employee_biometric_aliases alias
    where alias.confirmed
      and alias.normalized_alias = attendance.normalized_biometric_name
  );

notify pgrst, 'reload schema';
commit;
