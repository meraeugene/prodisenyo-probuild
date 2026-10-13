const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const { randomUUID } = require("node:crypto");
const load = require("./helpers/loadGmeaModule.cjs");
const { normalizeOperationExpenseInput } = load("features/gmea-operation-expenses/utils/operationExpenseValidation.ts");
const { selectOperationExpenses, summarizeOperationExpenses } = load("features/gmea-operation-expenses/utils/operationExpenseSelectors.ts");
const { buildOperationExpenseTrend } = load("features/gmea-operation-expenses/utils/operationExpenseCharts.ts");
const row = (date, category, amount) => ({ id: randomUUID(), date, category, amount, description: "Office costs", payee: "Supplier", method: "Cash", reference: "", notes: "", created_at: date });

test("operation expense weekly and monthly reports use dates and exact category totals", () => {
  const rows = [row("2026-09-28", "Transportation", 100.15), row("2026-09-30", "Salary", 300),
    row("2026-10-01", "Water", 50.25), row("2026-10-04", "Electricity", 100), row("2026-10-05", "Salary", 400)];
  const weekly = selectOperationExpenses(rows, "week", "2026-10-01", "", "");
  assert.equal(weekly.length, 4);
  assert.equal(summarizeOperationExpenses(weekly).total, 550.4);
  const monthly = selectOperationExpenses(rows, "month", "2026-10-01", "", "");
  assert.equal(monthly.length, 3);
  assert.equal(summarizeOperationExpenses(monthly).total, 550.25);
  assert.equal(selectOperationExpenses(rows, "month", "2026-10-01", "supplier", "Salary").length, 1);
  assert.equal(selectOperationExpenses(rows, "month", "invalid", "", "").length, 0);
});
test("operation input rejects unsupported categories, rolled dates and nonpositive amounts", () => {
  const valid = row("2026-02-28", "Salary", 10.2);
  assert.equal(normalizeOperationExpenseInput(valid).amount, 10.2);
  for (const extra of [{ category: "Rental fuel" }, { date: "2026-02-30" }, { amount: 0 }, { amount: 0.001 }, { description: "" }])
    assert.throws(() => normalizeOperationExpenseInput({ ...valid, ...extra }));
});

test("operation charts reconcile weekly daily amounts and monthly week buckets without crossing month boundaries", () => {
  const rows = [row("2026-09-28", "Transportation", 100.15), row("2026-09-30", "Salary", 300),
    row("2026-10-01", "Water", 50.25), row("2026-10-04", "Electricity", 100), row("2026-10-05", "Salary", 400)];
  const week = buildOperationExpenseTrend(rows, "week", "2026-10-01");
  assert.equal(week.length, 7);
  assert.deepEqual(week.map(row => row.amount), [100.15, 0, 300, 50.25, 0, 0, 100]);
  const month = buildOperationExpenseTrend(rows, "month", "2026-10-01");
  assert.deepEqual(month.slice(0, 2).map(row => [row.start, row.end, row.amount]), [["2026-10-01", "2026-10-04", 150.25], ["2026-10-05", "2026-10-11", 400]]);
  assert.equal(month.reduce((sum, row) => sum + row.amount, 0), 550.25);
  assert.equal(month.at(-1).end, "2026-10-31");
  const leap = buildOperationExpenseTrend([], "month", "2024-02-01");
  assert.equal(leap.at(-1).end, "2024-02-29");
  assert.deepEqual(buildOperationExpenseTrend(rows, "week", "invalid"), []);
});
test("new operation expense route is protected in matcher, middleware and page", () => {
  assert.match(fs.readFileSync("proxy.ts", "utf8"), /gmea-operation-expenses\/:path\*/);
  assert.match(fs.readFileSync("lib/supabase/middleware.ts", "utf8"), /GMEA_WORKSPACE_PREFIXES[^\n]+gmea-operation-expenses/);
  assert.match(fs.readFileSync("app/(dashboard)/gmea-operation-expenses/page.tsx", "utf8"), /requireRole\(\[APP_ROLES.GMEA, APP_ROLES.CEO\]\)/);
});
