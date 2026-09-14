const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const test = require("node:test");
const { PGlite } = require("@electric-sql/pglite");

const migrationPath = path.join(
  process.cwd(),
  "supabase",
  "biometric-identity-resolution.sql",
);

async function createMigrationDatabase() {
  const database = new PGlite();
  await database.exec(`
    create schema if not exists auth;
    create function auth.role() returns text language sql stable as
      'select ''authenticated''::text';
    create table public.profiles (id uuid primary key default gen_random_uuid());
    create table public.employees (
      id uuid primary key default gen_random_uuid(),
      full_name text not null
    );
    create table public.attendance_records (
      id uuid primary key default gen_random_uuid(),
      employee_id uuid references public.employees(id),
      employee_name text not null
    );
    create function public.set_updated_at() returns trigger language plpgsql as $$
    begin
      new.updated_at = timezone('utc', now());
      return new;
    end;
    $$;
    create function public.is_ceo() returns boolean language sql stable as
      'select true';
    create function public.is_payroll_manager() returns boolean language sql stable as
      'select true';
  `);
  return database;
}

test("requested reference aliases merge reversed and likely names canonically", async () => {
  const database = await createMigrationDatabase();
  await database.exec(`
    insert into public.employees (full_name) values
      ('Adam Taer'),
      ('Aidan Tundag'),
      ('Roland Pimentel'),
      ('Dominador Paquit'),
      ('Jose Subingsubing'),
      ('Vincent Subingsubing');
    insert into public.attendance_records (employee_name) values
      ('Skilled Adam'),
      ('Roland P'),
      ('Pimentel Roland'),
      ('S Pimentel Roland'),
      ('Skilled Roland Pimentel'),
      ('Doming'),
      ('Sobingsobing');
  `);

  const migration = await readFile(migrationPath, "utf8");
  await database.exec(migration);
  await database.exec(migration);

  const aliases = await database.query(`
    select normalized_alias, confirmed
    from public.employee_biometric_aliases
    where normalized_alias in (
      'skilled adam', 'roland p', 'pimentel roland',
      's pimentel roland', 'skilled roland pimentel', 'doming',
      'sobingsobing'
    )
    order by normalized_alias
  `);
  assert.deepEqual(aliases.rows, [
    { normalized_alias: "doming", confirmed: true },
    { normalized_alias: "pimentel roland", confirmed: true },
    { normalized_alias: "roland p", confirmed: true },
    { normalized_alias: "s pimentel roland", confirmed: true },
    { normalized_alias: "skilled adam", confirmed: true },
    { normalized_alias: "skilled roland pimentel", confirmed: true },
  ]);

  const attendance = await database.query(`
    select employee_name, raw_biometric_name, match_status
    from public.attendance_records
    order by raw_biometric_name
  `);
  assert.deepEqual(attendance.rows, [
    {
      employee_name: "Dominador Paquit",
      raw_biometric_name: "Doming",
      match_status: "MATCHED",
    },
    {
      employee_name: "Roland Pimentel",
      raw_biometric_name: "Pimentel Roland",
      match_status: "MATCHED",
    },
    {
      employee_name: "Roland Pimentel",
      raw_biometric_name: "Roland P",
      match_status: "MATCHED",
    },
    {
      employee_name: "Roland Pimentel",
      raw_biometric_name: "S Pimentel Roland",
      match_status: "MATCHED",
    },
    {
      employee_name: "Adam Taer",
      raw_biometric_name: "Skilled Adam",
      match_status: "MATCHED",
    },
    {
      employee_name: "Roland Pimentel",
      raw_biometric_name: "Skilled Roland Pimentel",
      match_status: "MATCHED",
    },
    {
      employee_name: "Sobingsobing",
      raw_biometric_name: "Sobingsobing",
      match_status: "UNMATCHED",
    },
  ]);

  const employees = await database.query(`
    select count(*)::integer as count
    from public.employees
  `);
  assert.equal(employees.rows[0].count, 83);
});
