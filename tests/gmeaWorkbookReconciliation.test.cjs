const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const { randomUUID } = require("node:crypto");
const { PGlite } = require("@electric-sql/pglite");
const load = require("./helpers/loadGmeaModule.cjs");
const { buildContractWorkbookPlan, verifyContractWorkbookResult } = load("features/gmea-projects/utils/contractWorkbookReconciliation.ts");
const { applyGmeaContractReconciliation } = load("actions/gmeaContractReconciliation.ts");
const { protectWorkbookBalances } = load("features/gmea-projects/utils/workbookBalanceProtection.ts");
const { projectExpenseTotal, contractCollectionSummary, projectSummary } = load("features/gmea-projects/utils/gmeaCalculations.ts");
const { normalizeMutation } = load("features/gmea-projects/utils/gmeaValidation.ts");
const { buildGmeaOverview } = load("features/gmea-overview/utils/gmeaOverviewSelectors.ts");
const { stableId, sourceDate } = require("../scripts/lib/gmeaContractWorkbook.cjs");
const actor = "11111111-1111-4111-8111-111111111111";
const source = { workbook: "OPERATIONS EXPENSES.xlsx", sheet: "PROJECT CONTRACT", sha256: "a".repeat(64), imported_at: "2026-10-09T00:00:00Z" };
const expense = (amount) => ({ id: randomUUID(), amount, refunded_amount: 0, vat_mode: "off", vat_rate: 0, date: "2026-08-01" });
const receipt = (amount, received_date) => ({ id: randomUUID(), amount, received_date, status: "posted" });
const term = (amount, receipts = [], sort_order = 0) => ({ id: randomUUID(), description: "Milestone", value_mode: "percentage", percentage: 50, amount, notes: "Original note", sort_order, receipts });
function project(title, contract, expenses, terms) {
  return { id: randomUUID(), title, name: title, version: 1, contract_amount: contract, tax_rate: 0, status: "active", expenses, payment_terms: terms, partners: [], created_at: "2026-08-01", client: "", location: "CDO" };
}
function simulate(initial, plan) {
  const output = structuredClone(initial);
  for (const command of plan.commands) {
    if (command.kind === "void_receipt") output.payment_terms.flatMap((item) => item.receipts).find((entry) => entry.id === command.receipt_id).status = "voided";
    if (command.kind === "contract_terms") output.payment_terms = command.value.payment_terms.map((item) => ({ ...item, receipts: output.payment_terms.find((old) => old.id === item.id).receipts }));
    if (command.kind === "record_receipt") output.payment_terms.find((item) => item.id === command.value.term_id).receipts.push({ ...command.value, status: "posted" });
    if (command.kind === "expense") output.expenses.push(command.value);
    if (command.kind === "project_status") output.status = command.value.status;
    output.version++;
  }
  return output;
}

test("source fixed amounts correct Bulua and Royal without deleting receipt history", () => {
  const initial = [
    project("BULUA", 175000, [expense(175195)], [term(131250, [receipt(130000, "2026-06-23"), receipt(1250, "2026-07-29")]), term(43750, [receipt(43750, "2026-07-29")], 1)]),
    project("ROYAL CABLE PSA CONDUIT", 85000, [expense(37408.9)], [term(68000), term(17000, [], 1)]),
  ];
  const records = [
    { row: 6, title: "BULUA", contract: 175000, expenses: 175195.5, status: "completed", terms: [{ amount: 130000, collected: 130000, date: "2026-06-23", cells: "H6:I6" }, { amount: 45000, collected: 45000, date: "2026-07-29", cells: "L6:M6" }] },
    { row: 12, title: "ROYAL CABLE PSA CONDUIT", contract: 85000, expenses: 37408.9, status: "completed", terms: [{ amount: 42500, collected: 42500, date: "2026-08-10", cells: "H12:I12" }, { amount: 42500, collected: 42500, date: "2026-08-15", cells: "L12:M12" }] },
  ];
  const plans = buildContractWorkbookPlan(records, initial, source, stableId);
  const result = initial.map((item, index) => simulate(item, plans[index]));
  verifyContractWorkbookResult(plans, result);
  assert.equal(projectSummary(result[0]).profit, -195.5);
  assert.deepEqual(result[0].payment_terms.map((item) => item.amount), [130000, 45000]);
  assert.equal(result[0].payment_terms.flatMap((item) => item.receipts).filter((item) => item.status === "voided").length, 3);
  assert.equal(result[0].payment_terms.flatMap((item) => item.receipts).length, 5);
  assert.deepEqual(result[1].payment_terms.map((item) => item.amount), [42500, 42500]);
  assert.ok(result.every((item) => item.status === "completed"));
  assert.ok(buildContractWorkbookPlan(records, result, source, stableId).every((plan) => plan.commands.length === 0));
});

test("expense cent correction and undated collections flow into all portfolio totals", () => {
  const initial = [
    project("CVH - PABX - FDAS", 744550, [expense(349953.51)], [term(595640, [receipt(595640, "2026-07-03")]), term(148910, [], 1)]),
    project("CVH 16 CAMERAS ANALOG", 92890, [], [term(74312), term(18578, [], 1)]),
  ];
  const records = [
    { row: 10, title: "CVH - PABX - FDAS", contract: 744550, expenses: 349953.5, status: "active", terms: [{ amount: 595640, collected: 595640, date: "2023-07-23", cells: "H10:I10" }, { amount: 148910, collected: 0, date: null, cells: "K10" }] },
    { row: 15, title: "CVH 16 CAMERAS ANALOG", contract: 92890, expenses: 10000, status: "active", terms: [{ amount: 74312, collected: 74312, date: null, cells: "H15:I15" }, { amount: 18578, collected: 0, date: null, cells: "K15" }] },
  ];
  const plans = buildContractWorkbookPlan(records, initial, source, stableId);
  const result = initial.map((item, index) => simulate(item, plans[index]));
  verifyContractWorkbookResult(plans, result);
  assert.equal(result[0].expenses[1].workbook_balance.amount, -0.01);
  assert.equal(projectExpenseTotal(result[0]), 349953.5);
  assert.equal(result[1].payment_terms[0].imported_receipts[0].received_date, null);
  assert.equal(result[1].expenses[0].date, "");
  assert.equal(contractCollectionSummary(result[1]).received, 74312);
  const overview = buildGmeaOverview({ projects: result, rentals: { rentals: [], payments: [], expenses: [], equipment: [], categories: [] } });
  assert.equal(overview.totalCollected, 669952);
  assert.equal(overview.notCollected, 167488);
  assert.equal(overview.totalExpenses, 359953.5);
  assert.equal(overview.netProfit, 477486.5);
  assert.ok(buildContractWorkbookPlan(records, result, source, stableId).every((plan) => plan.commands.length === 0));

  const p = result[1];
  assert.throws(() => protectWorkbookBalances({ kind: "delete", entity: "expense", id: p.expenses[0].id }, p), /cannot be edited/);
  assert.throws(() => protectWorkbookBalances({ kind: "record_receipt", value: { term_id: p.payment_terms[0].id, amount: 1 } }, p), /exceeds/);
  const normalized = normalizeMutation({ kind: "contract_terms", value: { contract_amount: 92890, tax_rate: 0, payment_terms: p.payment_terms.map((item) => ({ ...item, imported_receipts: [{ amount: 90000 }] })) } });
  const protectedCommand = protectWorkbookBalances(normalized, p);
  assert.deepEqual(protectedCommand.value.payment_terms[0].imported_receipts, p.payment_terms[0].imported_receipts);
  assert.throws(() => protectWorkbookBalances({ kind: "contract_terms", value: { payment_terms: [] } }, p), /Keep payment terms/);
  assert.equal(sourceDate("July 23,2023"), "2023-07-23");
  assert.equal(sourceDate(undefined), null);
});

test("ambiguous project identity, invalid totals and post-import expense changes stop reconciliation", () => {
  const p = project("WAREHOUSE", 78950, [], [term(63160), term(15790, [], 1)]);
  const record = { row: 13, title: "WAREHOUSE", contract: 78950, expenses: 56305, status: "completed", terms: [{ amount: 63160, collected: 63160, date: "2026-09-02", cells: "H13:I13" }, { amount: 15790, collected: 15790, date: "2026-09-02", cells: "L13:M13" }] };
  assert.throws(() => buildContractWorkbookPlan([record], [p, { ...p, id: randomUUID() }], source, stableId), /uniquely/);
  assert.throws(() => buildContractWorkbookPlan([{ ...record, title: "Unrelated" }], [p], source, stableId), /identity/);
  assert.throws(() => buildContractWorkbookPlan([{ ...record, terms: record.terms.map((item) => ({ ...item, amount: 1 })) }], [p], source, stableId), /total/);
  const [plan] = buildContractWorkbookPlan([record], [p], source, stableId);
  const imported = simulate(p, plan);
  imported.expenses.push(expense(100));
  assert.throws(() => buildContractWorkbookPlan([record], [imported], source, stableId), /changed after import/);
});

test("prepared commands persist source balances through the existing audited database RPC", async (t) => {
  const pg = new PGlite();
  t.after(() => pg.close());
  await pg.exec([
    "create role anon;create role authenticated;create role service_role bypassrls;create schema auth;",
    "create function auth.uid() returns uuid language sql as $$ select null::uuid $$;",
    "create type public.app_role as enum('admin','ceo','engineer','employee');",
    "create table public.profiles(id uuid primary key,role public.app_role,is_active boolean);",
    "create function public.current_app_role() returns public.app_role language sql as $$ select null::public.app_role $$;",
  ].join("\n"));
  for (const name of ["gmea-01-role.sql", "gmea-02-workspace.sql", "gmea-03-mutations.sql", "gmea-04-access.sql", "gmea-05-contract-payments.sql", "gmea-06-project-appearance.sql", "gmea-07-project-tax.sql", "gmea-08-project-status.sql"]) await pg.exec(fs.readFileSync(`supabase/${name}`, "utf8").replace(/^\uFEFF/, ""));
  await pg.query("insert into public.profiles values($1,'gmea',true)", [actor]);
  const initial = project("CVH ANALOG", 92890, [], [term(74312), term(18578, [], 1)]);
  await pg.query("insert into public.gmea_projects(id,name,title,location,duration,contract_amount) values($1,$2,$2,'CDO','7 Days',$3)", [initial.id, initial.title, initial.contract_amount]);
  for (const item of initial.payment_terms) await pg.query("insert into public.gmea_collections(id,project_id,data) values($1,$2,$3::jsonb)", [item.id, initial.id, JSON.stringify(item)]);
  const records = [{ row: 15, title: "CVH ANALOG", contract: 92890, expenses: 10000, status: "active", terms: [{ amount: 74312, collected: 74312, date: null, cells: "H15:I15" }, { amount: 18578, collected: 0, date: null, cells: "K15" }] }];
  const plans = buildContractWorkbookPlan(records, [initial], source, stableId);
  const db = {
    from: () => ({ select: () => ({ eq: (_column, id) => ({ single: async () => ({ data: (await pg.query("select version from public.gmea_projects where id=$1", [id])).rows[0], error: null }) }) }) }),
    rpc: async (_name, args) => {
      try { await pg.query("select public.mutate_gmea_project($1,$2,$3,$4::jsonb)", [args.p_actor, args.p_project, args.p_version, JSON.stringify(args.p_command)]); return { error: null }; }
      catch (error) { return { error }; }
    },
  };
  const journal = [];
  await applyGmeaContractReconciliation(db, actor, plans, (id, version) => journal.push({ id, version }));
  const saved = { ...(await pg.query("select * from public.gmea_projects where id=$1", [initial.id])).rows[0],
    expenses: (await pg.query("select id,data from public.gmea_expenses where project_id=$1", [initial.id])).rows.map((row) => ({ ...row.data, id: row.id })),
    payment_terms: (await pg.query("select id,data from public.gmea_collections where project_id=$1 order by (data->>'sort_order')::int", [initial.id])).rows.map((row) => ({ ...row.data, id: row.id, receipts: [] })),
    partners: [],
  };
  saved.contract_amount = Number(saved.contract_amount);
  saved.tax_rate = Number(saved.tax_rate);
  verifyContractWorkbookResult(plans, [saved]);
  assert.equal(saved.payment_terms[0].imported_receipts[0].source.cells, "H15:I15");
  assert.equal(journal.length, 2);
  await assert.rejects(applyGmeaContractReconciliation(db, actor, plans, () => {}), /Reload/);
});
