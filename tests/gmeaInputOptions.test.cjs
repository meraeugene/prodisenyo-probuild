const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const { randomUUID } = require("node:crypto");
const { PGlite } = require("@electric-sql/pglite");
const load = require("./helpers/loadGmeaModule.cjs");
const { addGmeaInputValues, mergeGmeaInputValues, normalizeGmeaSavedOptions } = load("features/gmea-inputs/utils/gmeaInputOptions.ts");

test("confirmed saves add suggestions locally while preserving existing choices across all areas", () => {
  const options = { methods: ["Cash"], suppliers: ["Acme"], invoiceNames: ["Client Corp"], clients: ["Client"], locations: ["Gusa"], services: ["Rental"] };
  const updated = addGmeaInputValues(options, { methods: " cash ", suppliers: " New   supplier ", locations: "", clients: "Another client" });
  assert.deepEqual(updated, { ...options, suppliers: ["Acme", "New supplier"], clients: ["Another client", "Client"] });
  assert.deepEqual(options.suppliers, ["Acme"], "The cached input object is not mutated");
});

test("saved input values normalize whitespace, deduplicate case, and validate fields and limits", () => {
  assert.deepEqual(mergeGmeaInputValues([" Cash ", "cash", "Bank   transfer", "", undefined], ["BANK TRANSFER"]), ["Bank transfer", "Cash"]);
  assert.deepEqual(normalizeGmeaSavedOptions({ method: " Bank   transfer ", supplier: "  " }), [{ field: "method", value: "Bank transfer" }]);
  assert.throws(() => normalizeGmeaSavedOptions({ role: "ceo" }), /Invalid/);
  assert.throws(() => normalizeGmeaSavedOptions({ method: "x".repeat(101) }), /too long/);
});

test("reusable choices persist in the existing database table and concurrent case duplicates are harmless", async t => {
  const db = new PGlite(); t.after(() => db.close());
  const migration = fs.readFileSync("supabase/gmea-02-workspace.sql", "utf8");
  await db.exec(migration.match(/create table if not exists public\.gmea_expense_options \([\s\S]*?\);/)[0]);
  await db.exec(migration.match(/create unique index if not exists gmea_expense_options_unique[\s\S]*?;/)[0]);
  const { rememberGmeaInputOptions } = load("actions/utils/rememberGmeaInputOptions.ts", {
    "server-only": {}, "@/features/gmea-projects/server/gmeaDatabase": { gmeaWriter: () => ({ from: table => {
      assert.equal(table, "gmea_expense_options");
      return { insert: async row => {
        try { await db.query("insert into gmea_expense_options(field,value) values($1,$2)", [row.field, row.value]); return { error: null }; }
        catch (error) { return { error }; }
      } };
    } }) },
  });
  await Promise.all([rememberGmeaInputOptions({ method: "Custom bank method", supplier: "Acme" }), rememberGmeaInputOptions({ method: "custom bank method", supplier: "ACME" })]);
  await rememberGmeaInputOptions({ invoice_name: "Customer Corp.", method: " CUSTOM BANK METHOD " });
  const rows = (await db.query("select field,value from gmea_expense_options order by field")).rows;
  assert.equal(rows.length, 3);
  assert.equal(rows.find(row => row.field === "method").value.toLowerCase(), "custom bank method");
});

test("GMEA option queries merge saved choices and transaction values across all three areas", async () => {
  let allowed = false;
  const { getGmeaInputOptions } = load("features/gmea-inputs/server/gmeaInputOptionsQueries.ts", {
    "server-only": {}, "@/lib/auth": { APP_ROLES: { GMEA: "gmea", CEO: "ceo" }, requireRole: async roles => { assert.deepEqual(roles, ["gmea", "ceo"]); if (!allowed) throw new Error("Forbidden"); } },
    "@/features/gmea-projects/server/gmeaQueries": {
      getGmeaExpenseOptions: async () => ({ methods: ["Custom method"], suppliers: ["Acme"], invoiceNames: ["Customer Corp."] }),
      getGmeaProjects: async () => [{ client: "Project client", location: "Gusa", expenses: [], payment_terms: [{ receipts: [{ method: "Bank" }] }] }],
    },
    "@/features/gmea-rentals/server/gmeaRentalsQueries": {
      getGmeaRentals: async () => [], getGmeaRentalOperations: async () => ({ expenses: [{ supplier: "New supplier", method: "Cash" }] }),
    },
    "@/features/gmea-rentals/server/historicalIncomeQueries": { getHistoricalRentalIncome: async () => [{ client: "Rental client", location: "gusa", items: [{ equipment_name: "Backhoe rental" }], payments: [{ method: "GCash" }] }] },
    "@/features/gmea-operation-expenses/server/operationExpensesQueries": { getGmeaOperationExpenses: async () => [{ payee: "ACME", method: "Operation method" }] },
  });
  await assert.rejects(getGmeaInputOptions(), /Forbidden/);
  allowed = true;
  const options = await getGmeaInputOptions();
  assert.ok(options.methods.includes("Custom method") && options.methods.includes("Operation method") && options.methods.includes("Bank"));
  assert.equal(options.suppliers.filter(value => value.toLowerCase() === "acme").length, 1);
  assert.deepEqual(options.locations, ["Gusa"]);
  assert.deepEqual(options.clients, ["Project client", "Rental client"]);
  assert.deepEqual(options.services, ["Backhoe rental"]);
});

test("unauthorized saves cannot store choices and a failed choice write cannot partially save an operation expense", async () => {
  let authorized = false, failOptions = false;
  const calls = [];
  const { saveGmeaOperationExpenseAction } = load("actions/gmeaOperationExpenses.ts", {
    "next/cache": { revalidatePath: () => {} },
    "@/lib/auth": { APP_ROLES: { GMEA: "gmea" }, requireRole: async () => { if (!authorized) throw new Error("Forbidden"); return { user: { id: randomUUID() } }; } },
    "@/features/gmea-operation-expenses/server/operationExpensesQueries": { getGmeaOperationExpenses: async () => [] },
    "@/features/gmea-operation-expenses/server/operationExpensesDatabase": { operationExpensesWriter: () => ({ from: () => ({ insert: () => { calls.push("expense"); return { select: () => ({ single: async () => ({ data: { id: "saved", amount: 10 }, error: null }) }) }; } }) }) },
    "./utils/rememberGmeaInputOptions": { rememberGmeaInputOptions: async values => { calls.push("options"); assert.equal(values.method, "New method"); if (failOptions) throw new Error("Options unavailable"); } },
  });
  const value = { id: randomUUID(), date: "2026-10-01", category: "Water", description: "Water bill", amount: 10, payee: "Acme", method: "New method", reference: "", notes: "" };
  await assert.rejects(saveGmeaOperationExpenseAction(null, value), /Forbidden/);
  assert.deepEqual(calls, []);
  authorized = true; failOptions = true;
  await assert.rejects(saveGmeaOperationExpenseAction(null, value), /Options unavailable/);
  assert.deepEqual(calls, ["options"]);
  calls.length = 0; failOptions = false;
  assert.deepEqual(await saveGmeaOperationExpenseAction(null, value), { id: "saved", amount: 10, alreadyAdded: false });
  assert.deepEqual(calls, ["options", "expense"]);
});
