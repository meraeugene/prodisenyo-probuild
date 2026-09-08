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
const migrations = [
  "gmea-01-role.sql",
  "gmea-02-workspace.sql",
  "gmea-03-mutations.sql",
  "gmea-04-access.sql",
  "gmea-05-contract-payments.sql",
];

function paymentTerms(firstId = randomUUID(), secondId = randomUUID()) {
  return [
    {
      id: firstId,
      description: "Down payment of the contract",
      value_mode: "percentage",
      percentage: 75,
      amount: 0,
      notes: "",
    },
    {
      id: secondId,
      description: "Completion and turnover",
      value_mode: "percentage",
      percentage: 25,
      amount: 0,
      notes: "",
    },
  ];
}

function createProjectCommand(name, terms) {
  return {
    kind: "create_project",
    value: {
      details: {
        name,
        client: "",
        location: "Corrales Ave, Cagayan de Oro City",
        duration: "7 Days",
      },
      contract: {
        contract_amount: 175000,
        payment_terms: terms,
      },
    },
  };
}

test("GMEA contract payments, expenses, transactions, and access", async (t) => {
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

  for (const name of migrations)
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
      await db.query("select version from public.gmea_projects where id=$1", [id])
    ).rows[0].version;
  }

  const firstTermId = randomUUID();
  const secondTermId = randomUUID();
  const terms = paymentTerms(firstTermId, secondTermId);
  const projectId = await mutate(
    null,
    null,
    createProjectCommand("Installation of Analog CCTV", terms),
  );

  await t.test("project creation stores its chosen schedule atomically", async () => {
    const project = (
      await db.query(
        "select name,client,location,contract_amount,duration from public.gmea_projects where id=$1",
        [projectId],
      )
    ).rows[0];
    assert.equal(project.client, "");
    assert.equal(Number(project.contract_amount), 175000);
    assert.equal(
      (
        await db.query("select id from public.gmea_partners where project_id=$1", [
          projectId,
        ])
      ).rows.length,
      2,
    );
    const schedule = (
      await db.query(
        "select data from public.gmea_collections where project_id=$1 order by (data->>'sort_order')::int",
        [projectId],
      )
    ).rows.map((row) => row.data);
    assert.equal(schedule[0].description, "Down payment of the contract");
    assert.equal(schedule[0].value_mode, "percentage");
    assert.equal(Number(schedule[0].amount), 131250);
    assert.equal(Number(schedule[1].amount), 43750);
  });

  await t.test("legacy quotation tables are removed and the new receipt table exists", async () => {
    const result = await db.query(
      "select to_regclass('public.gmea_quotations') quotation,to_regclass('public.gmea_milestones') milestones,to_regclass('public.gmea_receipts') legacy_receipts,to_regclass('public.gmea_collection_receipts') collection_receipts",
    );
    assert.equal(result.rows[0].quotation, null);
    assert.equal(result.rows[0].milestones, null);
    assert.equal(result.rows[0].legacy_receipts, null);
    assert.equal(result.rows[0].collection_receipts, "gmea_collection_receipts");
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
    refunded_amount: 1175,
    vat_mode: "off",
    vat_rate: 0,
    method: "Cash",
  };

  await t.test("expenses and reusable dropdown values save atomically", async () => {
    await mutate(projectId, 1, { kind: "expense", value: expense });
    assert.equal(await version(projectId), 2);
    const saved = (
      await db.query("select data from public.gmea_expenses where id=$1", [expenseId])
    ).rows[0].data;
    assert.equal(saved.invoice_number, "00059");
    assert.equal(Number(saved.refunded_amount), 1175);
    const notification = (
      await db.query(
        "select * from public.gmea_expense_notifications where expense_id=$1 and recipient_id=$2",
        [expenseId, ceo],
      )
    ).rows[0];
    assert.ok(notification);
    assert.equal(notification.read_at, null);
  });

  await t.test("contract terms preserve notes and cannot total a different contract", async () => {
    const updated = terms.map((term, index) => ({
      ...term,
      notes: index ? "" : "Legacy payment detail retained for verification",
    }));
    await mutate(projectId, 2, {
      kind: "contract_terms",
      value: { contract_amount: 175000, payment_terms: updated },
    });
    assert.equal(await version(projectId), 3);
    const saved = (
      await db.query("select data from public.gmea_collections where id=$1", [
        firstTermId,
      ])
    ).rows[0].data;
    assert.equal(saved.notes, "Legacy payment detail retained for verification");
    assert.equal(Number(saved.amount), 131250);
  });

  const firstReceiptId = randomUUID();
  const secondReceiptId = randomUUID();
  function receipt(id, amount) {
    return {
      kind: "record_receipt",
      value: {
        id,
        term_id: firstTermId,
        amount,
        received_date: "2026-09-07",
        method: "Bank transfer",
        reference_number: "REF-" + amount,
        notes: "",
      },
    };
  }

  await t.test("multiple receipts support partial and fully paid milestones", async () => {
    await mutate(projectId, 3, receipt(firstReceiptId, 130000));
    assert.equal(await version(projectId), 4);
    let total = await db.query(
      "select coalesce(sum(amount),0) total from public.gmea_collection_receipts where term_id=$1 and status='posted'",
      [firstTermId],
    );
    assert.equal(Number(total.rows[0].total), 130000);

    await mutate(projectId, 4, receipt(secondReceiptId, 1250));
    assert.equal(await version(projectId), 5);
    total = await db.query(
      "select coalesce(sum(amount),0) total from public.gmea_collection_receipts where term_id=$1 and status='posted'",
      [firstTermId],
    );
    assert.equal(Number(total.rows[0].total), 131250);
  });

  await t.test("overpayments and destructive term edits are rejected", async () => {
    await assert.rejects(
      mutate(projectId, 5, receipt(randomUUID(), 1)),
      /exceeds the payment term balance/,
    );
    await assert.rejects(
      mutate(projectId, 5, {
        kind: "contract_terms",
        value: {
          contract_amount: 175000,
          payment_terms: [
            {
              ...terms[0],
              value_mode: "fixed",
              percentage: null,
              amount: 131000,
            },
            {
              ...terms[1],
              value_mode: "fixed",
              percentage: null,
              amount: 44000,
            },
          ],
        },
      }),
      /reduced below its received amount/,
    );
    await assert.rejects(
      mutate(projectId, 5, {
        kind: "contract_terms",
        value: {
          contract_amount: 175000,
          payment_terms: [
            {
              ...terms[1],
              value_mode: "fixed",
              percentage: null,
              amount: 175000,
            },
          ],
        },
      }),
      /receipt history cannot be deleted/,
    );
    assert.equal(await version(projectId), 5);
  });

  await t.test("voiding is auditable and excludes the receipt from posted totals", async () => {
    await mutate(projectId, 5, {
      kind: "void_receipt",
      receipt_id: secondReceiptId,
      reason: "Duplicate bank entry",
    });
    assert.equal(await version(projectId), 6);
    const voided = (
      await db.query(
        "select status,voided_by,voided_at,void_reason from public.gmea_collection_receipts where id=$1",
        [secondReceiptId],
      )
    ).rows[0];
    assert.equal(voided.status, "voided");
    assert.equal(voided.voided_by, actor);
    assert.ok(voided.voided_at);
    assert.equal(voided.void_reason, "Duplicate bank entry");
    const total = await db.query(
      "select coalesce(sum(amount),0) total from public.gmea_collection_receipts where term_id=$1 and status='posted'",
      [firstTermId],
    );
    assert.equal(Number(total.rows[0].total), 130000);
    await assert.rejects(
      mutate(projectId, 6, {
        kind: "void_receipt",
        receipt_id: secondReceiptId,
        reason: "Again",
      }),
      /already voided/,
    );
  });

  await t.test("stale and cross-project updates cannot overwrite data", async () => {
    await assert.rejects(
      mutate(projectId, 1, {
        kind: "project_details",
        value: {
          name: "Stale",
          client: "",
          location: "CDO",
          duration: "7 Days",
        },
      }),
      /changed/,
    );
    const otherTerms = paymentTerms();
    const other = await mutate(
      null,
      null,
      createProjectCommand("Other", otherTerms),
    );
    await assert.rejects(
      mutate(other, 1, { kind: "expense", value: expense }),
      /does not belong/,
    );
    assert.equal(await version(other), 1);
  });

  await t.test("project deletion cascades payment and expense records", async () => {
    const disposableTerms = paymentTerms();
    const disposable = await mutate(
      null,
      null,
      createProjectCommand("Disposable", disposableTerms),
    );
    const disposableReceipt = receipt(randomUUID(), 1);
    disposableReceipt.value.term_id = disposableTerms[0].id;
    await mutate(disposable, 1, disposableReceipt);
    await mutate(disposable, 2, { kind: "delete_project" });
    assert.equal(
      Number(
        (
          await db.query("select count(*) count from public.gmea_projects where id=$1", [
            disposable,
          ])
        ).rows[0].count,
      ),
      0,
    );
    assert.equal(
      Number(
        (
          await db.query(
            "select count(*) count from public.gmea_collection_receipts where project_id=$1",
            [disposable],
          )
        ).rows[0].count,
      ),
      0,
    );
  });

  await t.test("CEO, other roles, and inactive GMEA cannot write", async () => {
    for (const user of [ceo, engineer, inactive])
      await assert.rejects(
        mutate(
          projectId,
          await version(projectId),
          {
            kind: "project_details",
            value: {
              name: "Blocked",
              client: "",
              location: "CDO",
              duration: "7 Days",
            },
          },
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
          (await db.query("select id from public.gmea_collection_receipts")).rows
            .length,
        );
      });
    for (const user of [engineer, inactive])
      await asUser(user, async () => {
        assert.equal((await db.query("select id from public.gmea_projects")).rows.length, 0);
        assert.equal(
          (await db.query("select id from public.gmea_collection_receipts")).rows.length,
          0,
        );
      });
  });

  await t.test("direct client writes and payroll reads remain blocked", async () => {
    await asUser(actor, async () => {
      await assert.rejects(
        db.exec("delete from public.gmea_collection_receipts"),
        /permission denied/,
      );
      assert.equal((await db.query("select * from public.payroll_runs")).rows.length, 0);
    });
    await asUser(ceo, async () =>
      assert.equal((await db.query("select * from public.payroll_runs")).rows.length, 1),
    );
  });

  await t.test("reapplying setup preserves history and flags legacy notes", async () => {
    const legacyTermId = randomUUID();
    await db.query(
      "insert into public.gmea_collections(id,project_id,data) values($1,$2,$3::jsonb)",
      [
        legacyTermId,
        projectId,
        JSON.stringify({
          description: "Legacy completion payment",
          amount: 43750,
          status: "paid",
          method: "Cheque",
          reference_number: "2335308",
          date: "2026-08-15",
          deposit_status: "deposited",
        }),
      ],
    );
    for (const name of migrations.slice(1))
      await db.exec(
        fs.readFileSync("supabase/" + name, "utf8").replace(/^\uFEFF/, ""),
      );
    const migrated = (
      await db.query("select data from public.gmea_collections where id=$1", [
        legacyTermId,
      ])
    ).rows[0].data;
    assert.ok(migrated.notes.includes("Paid"));
    assert.ok(migrated.notes.includes("Cheque"));
    assert.equal(migrated.value_mode, "fixed");
    assert.equal(
      Number(
        (
          await db.query(
            "select count(*) count from public.gmea_collection_receipts where term_id=$1",
            [legacyTermId],
          )
        ).rows[0].count,
      ),
      0,
    );
    assert.equal(
      Number(
        (
          await db.query(
            "select count(*) count from public.gmea_collection_receipts where project_id=$1",
            [projectId],
          )
        ).rows[0].count,
      ),
      2,
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
    "insert into public.gmea_receipts(id,project_id,data) values($1,$2,$3::jsonb)",
    [randomUUID(), projectId, JSON.stringify({ withholding: 1579 })],
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
    (
      await db.query(
        "select to_regclass('public.gmea_quotations') legacy_table",
      )
    ).rows[0].legacy_table,
    null,
  );
});
