const assert = require("node:assert/strict"),
  test = require("node:test"),
  fs = require("node:fs");
const { randomUUID } = require("node:crypto"),
  { PGlite } = require("@electric-sql/pglite");
const { normalizeMutation } = require("./helpers/loadGmeaModule.cjs")(
  "features/gmea-projects/utils/gmeaValidation.ts",
);
const actor = "11111111-1111-4111-8111-111111111111",
  ceo = "22222222-2222-4222-8222-222222222222",
  engineer = "33333333-3333-4333-8333-333333333333",
  inactive = "44444444-4444-4444-8444-444444444444";
test("GMEA database transactions history and role isolation", async (t) => {
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
    const r = await db.query(
      "select public.mutate_gmea_project($1,$2,$3,$4::jsonb) id",
      [user, projectId, version, JSON.stringify(normalizeMutation(command))],
    );
    return r.rows[0].id;
  }
  async function version(id) {
    return (
      await db.query("select version from public.gmea_projects where id=$1", [
        id,
      ])
    ).rows[0].version;
  }
  const input = {
    name: "Test solar",
    client: "Client",
    location: "CDO",
    description: "",
    start_date: null,
    end_date: null,
    duration: "7–14 days",
    status: "planning",
  };
  const projectId = await mutate(null, null, { kind: "project", value: input }),
    quoteId = randomUUID();
  const quote = {
    id: quoteId,
    reference: "Q-001",
    date: "2026-09-07",
    notes: "",
    items: [
      { description: "Solar", unit: "lot", quantity: 1, unit_price: 175000 },
    ],
    discount: 0,
    vat_mode: "off",
    vat_rate: 0,
  };
  await t.test(
    "creation includes partners and quotation items save atomically",
    async () => {
      assert.equal(
        (
          await db.query(
            "select data from public.gmea_partners where project_id=$1",
            [projectId],
          )
        ).rows.length,
        2,
      );
      await mutate(projectId, 1, { kind: "quotation", value: quote });
      assert.equal(await version(projectId), 2);
      assert.equal(
        Number(
          (
            await db.query(
              "select total from public.gmea_quotations where id=$1",
              [quoteId],
            )
          ).rows[0].total,
        ),
        175000,
      );
    },
  );
  await t.test(
    "accepted history is immutable and stale edits fail",
    async () => {
      await mutate(projectId, 2, { kind: "accept", id: quoteId });
      await assert.rejects(
        mutate(projectId, 2, { kind: "project", value: input }),
        /changed/,
      );
      await assert.rejects(
        mutate(projectId, 3, { kind: "quotation", value: quote }),
        /draft/,
      );
      await assert.rejects(
        mutate(projectId, 3, {
          kind: "delete",
          entity: "quotation",
          id: quoteId,
        }),
        /cannot be removed/,
      );
      const revision = { ...quote, id: randomUUID(), reference: "Q-002" };
      await mutate(projectId, 3, { kind: "quotation", value: revision });
      await mutate(projectId, 4, { kind: "accept", id: revision.id });
      assert.deepEqual(
        (
          await db.query(
            "select status from public.gmea_quotations where project_id=$1",
            [projectId],
          )
        ).rows
          .map((r) => r.status)
          .sort(),
        ["accepted", "superseded"],
      );
    },
  );
  await t.test(
    "concurrent saves using the same version do not overwrite",
    async () => {
      const v = await version(projectId),
        r = await Promise.allSettled([
          mutate(projectId, v, {
            kind: "project",
            value: { ...input, name: "A" },
          }),
          mutate(projectId, v, {
            kind: "project",
            value: { ...input, name: "B" },
          }),
        ]);
      assert.equal(r.filter((x) => x.status === "fulfilled").length, 1);
      assert.equal(r.filter((x) => x.status === "rejected").length, 1);
    },
  );
  await t.test("milestones with receipts cannot be removed", async () => {
    const m = randomUUID();
    await mutate(projectId, await version(projectId), {
      kind: "milestones",
      value: [{ id: m, label: "Completion", percentage: 100 }],
    });
    await mutate(projectId, await version(projectId), {
      kind: "receipt",
      value: {
        id: randomUUID(),
        milestone_id: m,
        date: "2026-09-07",
        cash: 1000,
        withholding: 20,
        method: "Cash",
        reference: "0001",
        notes: "",
      },
    });
    await assert.rejects(
      mutate(projectId, await version(projectId), {
        kind: "milestones",
        value: [],
      }),
      /cannot be removed/,
    );
    assert.equal(
      (
        await db.query(
          "select data from public.gmea_receipts where project_id=$1",
          [projectId],
        )
      ).rows[0].data.cash,
      1000,
    );
  });
  await t.test(
    "cross-project ids cannot overwrite financial entries",
    async () => {
      const other = await mutate(null, null, { kind: "project", value: input });
      await assert.rejects(
        mutate(other, 1, { kind: "quotation", value: quote }),
        /draft/,
      );
      const r = (
        await db.query(
          "select id,data from public.gmea_receipts where project_id=$1",
          [projectId],
        )
      ).rows[0];
      await assert.rejects(
        mutate(other, 1, {
          kind: "receipt",
          value: { ...r.data, id: r.id, milestone_id: null },
        }),
        /does not belong/,
      );
      assert.equal(await version(other), 1);
    },
  );
  await t.test(
    "archive blocks financial writes and preserves history",
    async () => {
      await mutate(projectId, await version(projectId), {
        kind: "project",
        value: { ...input, status: "archived" },
      });
      await assert.rejects(
        mutate(projectId, await version(projectId), {
          kind: "quotation",
          value: { ...quote, id: randomUUID() },
        }),
        /Restore/,
      );
      await mutate(projectId, await version(projectId), {
        kind: "project",
        value: input,
      });
    },
  );
  await t.test(
    "CEO other roles and inactive accounts cannot invoke privileged writes",
    async () => {
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
    },
  );
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
      await asUser(user, async () =>
        assert.ok(
          (await db.query("select id from public.gmea_projects")).rows.length,
        ),
      );
    for (const user of [engineer, inactive])
      await asUser(user, async () =>
        assert.equal(
          (await db.query("select id from public.gmea_projects")).rows.length,
          0,
        ),
      );
  });
  await t.test(
    "direct client writes and service-only RPC are inaccessible",
    async () => {
      await asUser(actor, async () => {
        await assert.rejects(
          db.exec("delete from public.gmea_projects"),
          /permission denied/,
        );
        await assert.rejects(
          db.query("select public.mutate_gmea_project($1,$2,1,'{}')", [
            actor,
            projectId,
          ]),
          /permission denied/,
        );
      });
    },
  );
  await t.test(
    "GMEA cannot read payroll or promote itself; ordinary profile edits work",
    async () => {
      await asUser(actor, async () => {
        assert.equal(
          (await db.query("select * from public.payroll_runs")).rows.length,
          0,
        );
        await assert.rejects(
          db.query("update public.profiles set role='ceo' where id=$1", [
            actor,
          ]),
          /privileges/,
        );
        await assert.rejects(
          db.query("update public.profiles set is_active=false where id=$1", [
            actor,
          ]),
          /privileges/,
        );
        await db.query(
          "update public.profiles set full_name='Updated GMEA' where id=$1",
          [actor],
        );
      });
      await asUser(ceo, async () =>
        assert.equal(
          (await db.query("select * from public.payroll_runs")).rows.length,
          1,
        ),
      );
    },
  );
  await t.test("reapplying migrations retains history", async () => {
    for (const name of [
      "gmea-02-workspace.sql",
      "gmea-03-mutations.sql",
      "gmea-04-access.sql",
    ])
      await db.exec(
        fs.readFileSync("supabase/" + name, "utf8").replace(/^\uFEFF/, ""),
      );
    assert.equal(
      (await db.query("select count(*)::int n from public.gmea_quotations"))
        .rows[0].n,
      2,
    );
  });
});
