const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const { PGlite } = require("@electric-sql/pglite");

test("demo fixtures obey real schema constraints, support reruns, and clean up without deleting unrelated data", async (t) => {
  const { createDemoContext, DEMO_ROLES, demoAccount } = await import("../scripts/demo/context.mjs");
  const { buildDemoData, TABLE_ORDER } = await import("../scripts/demo/data.mjs");
  const { isDemoAccount } = await import("../scripts/demo/accounts.mjs");
  assert.equal(isDemoAccount({ email: "demo_ceo@prodisenyo.local" }), false);
  assert.equal(isDemoAccount({ email: "ceo@prodisenyo.local", app_metadata: { demo_seed: "prodisenyo-ui-demo-v1" } }), false);
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $$select null::uuid$$;
    create function auth.role() returns text language sql as $$select 'service_role'::text$$;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key, bucket_id text, name text);
    create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;
  `);
  const migrations = [
    "schema.sql", "budget-tracker-schema.sql", "cost-estimator-schema.sql", "projects-schema.sql",
    "construction-project-flow.sql", "complete-workflow.sql", "estimate-procurement-workflow.sql",
    "project-progress-updates.sql", "project-documents.sql", "biometric-identity-resolution.sql", "payroll-attendance-review.sql",
    "gmea-01-role.sql", "gmea-02-workspace.sql", "gmea-03-mutations.sql", "gmea-04-access.sql",
    "gmea-05-contract-payments.sql", "gmea-06-project-appearance.sql", "gmea-07-project-tax.sql", "gmea-08-project-status.sql",
    "gmea-rentals-01-foundation.sql", "gmea-rentals-02-equipment-management.sql", "gmea-rentals-03-rental-workspace.sql",
    "gmea-rentals-04-collections.sql", "gmea-rentals-05-expenses-workers.sql", "gmea-rentals-06-ceo-expense-unread.sql",
  ];
  for (const migration of migrations) {
    const sql = fs.readFileSync(`supabase/${migration}`, "utf8").replace(/^\uFEFF/, "").replace('create extension if not exists "pgcrypto";', "");
    await db.exec(sql);
  }
  // Reproduce the exact older-schema gaps reported when running seed:data.
  const otherId = "12345678-1234-4234-a234-123456789abc";
  await db.query("insert into sites(id,code,name) values($1,'REAL-SITE','Existing site')", [otherId]);
  await db.exec(`
    alter table employee_branch_rates drop column overtime_multiplier;
    drop table employee_work_schedules;
    drop table payroll_holidays;
    drop table employee_leave_records;
    drop table payroll_attendance_days;
    drop table project_progress_submissions;
    alter table project_progress_updates drop column progress_date;
    alter table gmea_projects drop column status;
    alter table gmea_projects drop column completed_at;
    alter table gmea_projects drop column completed_by;
  `);
  const { buildDemoSchemaRepair } = await import("../scripts/demo/schemaRepair.mjs");
  const repair = buildDemoSchemaRepair();
  assert.equal(fs.readFileSync("supabase/demo-seed-schema-repair.sql", "utf8"), repair);
  await db.exec(repair);
  await db.exec(repair);
  assert.deepEqual((await db.query("select id,name from sites")).rows, [{ id: otherId, name: "Existing site" }]);
  const context = createDemoContext({}, new Date("2026-10-03T01:00:00Z"));
  for (const role of DEMO_ROLES) {
    const account = demoAccount(role);
    await db.query("insert into auth.users(id) values($1)", [context.user(role)]);
    await db.query("insert into profiles(id,username,email,full_name,role) values($1,$2,$3,$4,$5)", [context.user(role), account.username, account.email, account.full_name, role]);
  }
  const data = buildDemoData(context);
  assert.deepEqual(Object.keys(data).sort(), [...TABLE_ORDER].sort());
  for (let pass = 0; pass < 2; pass++) {
    if (pass === 1) await db.query("update projects set name='Edited demo' where id=$1", [context.id("project:0")]);
    for (const table of TABLE_ORDER) for (const row of data[table]) {
      const keys = Object.keys(row);
      const conflict = table.endsWith("expense_notifications") ? "expense_id,recipient_id" : "id";
      await db.query(`insert into ${table}(${keys.join(",")}) values(${keys.map((_, i) => `$${i + 1}`).join(",")}) on conflict(${conflict}) do nothing`, Object.values(row).map((v) => v && typeof v === "object" ? JSON.stringify(v) : v));
    }
  }
  assert.equal((await db.query("select name from projects where id=$1", [context.id("project:0")])).rows[0].name, "Edited demo");
  await db.query("update projects set active_approved_estimate_id=$1 where id=$2", [context.id("estimate:0"), context.id("project:0")]);
  assert.equal((await db.query("select count(*)::int n from payroll_runs")).rows[0].n, 9);
  assert.equal((await db.query("select count(*)::int n from gmea_rental_expense_notifications")).rows[0].n, 2);
  const futureData = buildDemoData(createDemoContext({}, new Date("2027-04-03T01:00:00Z")));
  for (const table of [...TABLE_ORDER].reverse()) {
    assert.deepEqual(futureData[table].map((row) => row.id), data[table].map((row) => row.id));
    await db.query(`delete from ${table} where id=any($1::uuid[])`, [data[table].map((row) => row.id)]);
  }
  assert.deepEqual((await db.query("select id from sites")).rows, [{ id: otherId }]);
  assert.equal((await db.query("select count(*)::int n from gmea_rental_expense_notifications")).rows[0].n, 0);
});
