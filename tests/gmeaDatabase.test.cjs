const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const { randomUUID } = require("node:crypto");
const { PGlite } = require("@electric-sql/pglite");
const { normalizeMutation } = require("./helpers/loadGmeaModule.cjs")(
  "features/gmea-projects/utils/gmeaValidation.ts",
);

const actor = "11111111-1111-4111-8111-111111111111";
const ceo = "22222222-2222-4222-8222-222222222222";
const engineer = "33333333-3333-4333-8333-333333333333";
const inactive = "44444444-4444-4444-8444-444444444444";

test("GMEA expense monitoring database, transactions, and access", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(
    [
      "create role anon;create role authenticated;create role service_role bypassrls;create schema auth;",
      "create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.user_id',true),'')::uuid $$;",
      "grant usage on schema auth to authenticated,service_role;",
      "create type public.app_role as enum('admin','ceo','engineer','employee');",
      "create table public.profiles(id uuid primary key,role public.app_role not null,is_active boolean not null default true,full_name text);",
      "grant select,update on public.profiles to authenticated;",
      "create function public.current_app_role() returns public.app_role language sql stable security definer as $$ select role from public.profiles where id=auth.uid() $$;",
      "create table public.payroll_runs(id integer);insert into public.payroll_runs values(1);",
      "alter table public.payroll_runs enable row level security;grant select on public.payroll_runs to authenticated;",
      "create policy broad_read on public.payroll_runs for select to authenticated using(true);",
    ].join("\n"),
  );

  for (const name of [
    "gmea-01-role.sql",
    "gmea-02-workspace.sql",
    "gmea-03-mutations.sql",
    "gmea-04-access.sql",
  ])
    await db.exec(
      fs.readFileSync("supabase/" + name, "utf8").replace(/^\uFEFF/, ""),
    );

  for (const [id, role, active] of [
    [actor, "gmea", true],
    [ceo, "ceo", true],
    [engineer, "engineer", true],
    [inactive, "gmea", false],
  ])
    await db.query("insert into public.profiles values($1,$2,$3,'Test')", [
      id,
      role,
      active,
    ]);

  async function mutate(projectId, version, command, user = actor) {
    const result = await db.query(
      "select public.mutate_gmea_project($1,$2,$3,$4::jsonb) id",
      [user, projectId, version, JSON.stringify(normalizeMutation(command))],
    );
    return result.rows[0].id;
  }

  async function version(id) {
    return (
      await db.query("select version from public.gmea_projects where id=$1", [
        id,
      ])
    ).rows[0].version;
  }

  const input = {
    name: "Installation of Analog CCTV",
    client: "",
    location: "Corrales Ave, Cagayan de Oro City",
    contract_amount: 83300,
    withholding_tax_rate: 0,
    duration: "7 Days",
    status: "planning",
  };

  const projectId = await mutate(null, null, {
    kind: "project",
    value: input,
  });

  await t.test("project stores only the workbook fields and default partners", async () => {
    const project = (
      await db.query(
        "select name,client,location,contract_amount,duration from public.gmea_projects where id=$1",
        [projectId],
      )
    ).rows[0];
    assert.equal(project.client, "");
    assert.equal(Number(project.contract_amount), 83300);
    assert.equal(
      (
        await db.query(
          "select id from public.gmea_partners where project_id=$1",
          [projectId],
        )
      ).rows.length,
      2,
    );
    const columns = (
      await db.query(
        "select column_name from information_schema.columns where table_schema='public' and table_name='gmea_projects'",
      )
    ).rows.map((row) => row.column_name);
    for (const removed of ["description", "start_date", "end_date"])
      assert.equal(columns.includes(removed), false);
  });

  await t.test("quotation and payment tables are removed", async () => {
    const result = await db.query(
      "select to_regclass('public.gmea_quotations') quotation,to_regclass('public.gmea_quotation_items') items,to_regclass('public.gmea_milestones') milestones,to_regclass('public.gmea_receipts') receipts",
    );
    assert.deepEqual(result.rows[0], {
      quotation: null,
      items: null,
      milestones: null,
      receipts: null,
    });
  });

  const expenseId = randomUUID();
  const expense = {
    id: expenseId,
    date: "2026-09-07",
    description: "Steel Nail Gun",
    category: "Materials",
    supplier: "JIMAR CONSTRUCTION SUPPLY CO.",
    invoice_number: "00059",
    invoice_name: "GMEA MARKETING CORP.",
    amount: 11568.2,
    vat_mode: "off",
    vat_rate: 0,
    method: "Cash",
    notes: "",
  };

  await t.test("expenses and reusable dropdown values save atomically", async () => {
    await mutate(projectId, 1, { kind: "expense", value: expense });
    assert.equal(await version(projectId), 2);
    const saved = (
      await db.query("select data from public.gmea_expenses where id=$1", [
        expenseId,
      ])
    ).rows[0].data;
    assert.equal(saved.invoice_number, "00059");
    const options = (
      await db.query(
        "select field,value from public.gmea_expense_options where value in ('JIMAR CONSTRUCTION SUPPLY CO.','Cash','GMEA MARKETING CORP.')",
      )
    ).rows;
    assert.ok(options.some((row) => row.field === "supplier"));
    assert.ok(options.some((row) => row.field === "method"));
    assert.ok(options.some((row) => row.field === "invoice_name"));
  });

  await t.test("stale and cross-project updates cannot overwrite data", async () => {
    await assert.rejects(
      mutate(projectId, 1, { kind: "project", value: input }),
      /changed/,
    );
    const other = await mutate(null, null, {
      kind: "project",
      value: { ...input, name: "Other" },
    });
    await assert.rejects(
      mutate(other, 1, { kind: "expense", value: expense }),
      /does not belong/,
    );
    assert.equal(await version(other), 1);
  });

  await t.test("archive blocks expense writes and restore enables them", async () => {
    await mutate(projectId, await version(projectId), {
      kind: "project",
      value: { ...input, status: "archived" },
    });
    await assert.rejects(
      mutate(projectId, await version(projectId), {
        kind: "expense",
        value: { ...expense, id: randomUUID() },
      }),
      /Restore/,
    );
    await mutate(projectId, await version(projectId), {
      kind: "project",
      value: { ...input, status: "active" },
    });
  });

  await t.test("CEO, other roles, and inactive GMEA cannot write", async () => {
    for (const user of [ceo, engineer, inactive])
      await assert.rejects(
        mutate(
          projectId,
          await version(projectId),
          { kind: "project", value: input },
          user,
        ),
        /Only active GMEA/,
      );
  });

  async function asUser(user, fn) {
    await db.query("select set_config('test.user_id',$1,false)", [user]);
    await db.exec("set role authenticated");
    try {
      return await fn();
    } finally {
      await db.exec("reset role");
    }
  }

  await t.test("RLS permits active GMEA and CEO reads only", async () => {
    for (const user of [actor, ceo])
      await asUser(user, async () => {
        assert.ok((await db.query("select id from public.gmea_projects")).rows.length);
        assert.ok(
          (await db.query("select value from public.gmea_expense_options")).rows
            .length,
        );
      });
    for (const user of [engineer, inactive])
      await asUser(user, async () =>
        assert.equal(
          (await db.query("select id from public.gmea_projects")).rows.length,
          0,
        ),
      );
  });

  await t.test("direct client writes and payroll reads remain blocked", async () => {
    await asUser(actor, async () => {
      await assert.rejects(
        db.exec("delete from public.gmea_expenses"),
        /permission denied/,
      );
      assert.equal((await db.query("select * from public.payroll_runs")).rows.length, 0);
    });
    await asUser(ceo, async () =>
      assert.equal((await db.query("select * from public.payroll_runs")).rows.length, 1),
    );
  });

  await t.test("reapplying setup retains expense history", async () => {
    for (const name of [
      "gmea-02-workspace.sql",
      "gmea-03-mutations.sql",
      "gmea-04-access.sql",
    ])
      await db.exec(
        fs.readFileSync("supabase/" + name, "utf8").replace(/^\uFEFF/, ""),
      );
    assert.equal(
      (
        await db.query(
          "select count(*)::int count from public.gmea_expenses where project_id=$1",
          [projectId],
        )
      ).rows[0].count,
      1,
    );
  });
});

test("old accepted quotation amount is preserved before legacy tables are removed", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  const projectId = randomUUID();
  const quotationId = randomUUID();
  await db.exec(
    [
      "create role anon;create role authenticated;create role service_role bypassrls;create schema auth;",
      "create function auth.uid() returns uuid language sql as $$ select null::uuid $$;",
      "create type public.app_role as enum('gmea','ceo');",
      "create table public.profiles(id uuid primary key,role public.app_role,is_active boolean);",
      "create table public.gmea_projects(id uuid primary key,name text not null,client text not null default '',location text not null,description text not null default '',start_date date,end_date date,duration text not null default '',status text not null default 'planning',version integer not null default 1,created_by uuid references public.profiles(id),updated_by uuid references public.profiles(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());",
      "create table public.gmea_quotations(id uuid primary key,project_id uuid not null references public.gmea_projects(id),status text,total numeric(16,2),data jsonb,created_at timestamptz default now(),updated_at timestamptz default now());",
      "create table public.gmea_quotation_items(id uuid primary key,quotation_id uuid references public.gmea_quotations(id));",
      "create table public.gmea_milestones(id uuid primary key,project_id uuid references public.gmea_projects(id));",
      "create table public.gmea_receipts(id uuid primary key,project_id uuid references public.gmea_projects(id),data jsonb not null);",
    ].join("\n"),
  );
  await db.query(
    "insert into public.gmea_projects(id,name,location,duration) values($1,'Legacy','CDO','7 Days')",
    [projectId],
  );
  await db.query(
    "insert into public.gmea_quotations(id,project_id,status,total,data) values($1,$2,'accepted',78950,'{}')",
    [quotationId, projectId],
  );
  await db.query(
    "insert into public.gmea_receipts(id,project_id,data) values($1,$2,'{\"withholding\":1579}')",
    [randomUUID(), projectId],
  );

  await db.exec(
    fs
      .readFileSync("supabase/gmea-02-workspace.sql", "utf8")
      .replace(/^\uFEFF/, ""),
  );

  assert.equal(
    Number(
      (
        await db.query(
          "select contract_amount from public.gmea_projects where id=$1",
          [projectId],
        )
      ).rows[0].contract_amount,
    ),
    78950,
  );
  assert.equal(
    Number(
      (
        await db.query(
          "select withholding_tax_rate from public.gmea_projects where id=$1",
          [projectId],
        )
      ).rows[0].withholding_tax_rate,
    ),
    2,
  );
  assert.equal(
    (
      await db.query(
        "select to_regclass('public.gmea_quotations') legacy_table",
      )
    ).rows[0].legacy_table,
    null,
  );
});
