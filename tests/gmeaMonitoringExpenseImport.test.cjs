const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");
const { buildMonitoringExpensePlans, verifyMonitoringExpenseResult } = load("features/gmea-projects/utils/monitoringExpenseImport.ts");
const { groupMonitoringExpenses } = load("features/gmea-projects/utils/monitoringExpenseGroups.ts");
const { projectExpenseTotal } = load("features/gmea-projects/utils/gmeaCalculations.ts");
const { protectWorkbookBalances } = load("features/gmea-projects/utils/workbookBalanceProtection.ts");
const { normalizeMutation } = load("features/gmea-projects/utils/gmeaValidation.ts");
const { readAmount, expenseDate } = require("../scripts/lib/gmeaMonitoringWorkbook.cjs");
const source = { workbook: "Monitoring.xlsx", sheet: "WAREHOUSE -CORRALES AVE.", cells: "A12:L12", sha256: "a".repeat(64), imported_at: "2026-10-09T00:00:00Z" };
function item(row, description, amount, extra = {}) {
  return { id: `item-${row}`, source_row: row, date: "", description, amount, refunded_amount: 0,
    vat_mode: "off", vat_rate: 0, supplier: "", invoice_number: "", notes: "Source", category: "Other", method: "",
    workbook_source: { ...source, cells: `A${row}:L${row}` }, ...extra };
}
const sheet = (title, items) => ({ title, rawSheet: title, items, total: items.reduce((sum, entry) => sum + entry.amount, 0), totalCell: "F22", ignored: [] });
const project = (title, expenses) => ({ id: "project", title, version: 1, expenses });
function balance(amount) {
  return { ...item(0, "Workbook expense balance", 0), id: "balance", workbook_source: undefined,
    workbook_balance: { amount, source_total: amount, itemized_total: 0, source: { ...source, sha256: "b".repeat(64) } } };
}
function apply(plan, initial, count = plan.commands.length) {
  const output = structuredClone(initial);
  for (const command of plan.commands.slice(0, count)) {
    assert.equal(command.kind, "expense");
    const index = output.expenses.findIndex((expense) => expense.id === command.value.id);
    if (index < 0) output.expenses.push(command.value);
    else output.expenses[index] = command.value;
    output.version++;
  }
  return output;
}

test("materializing source expenses consumes opening balances once, including interrupted imports", () => {
  const initial = project("WAREHOUSE CORRALEA AVE", [balance(8300)]);
  const incoming = sheet("WAREHOUSE -CORRALES AVE.", [item(12, "DVR Repair", 3500), item(13, "Seagate HDD", 4800)]);
  const { plans } = buildMonitoringExpensePlans([incoming], [initial]);
  assert.equal(plans[0].added.length, 2);
  assert.equal(plans[0].replacedBalance, 8300);
  const result = apply(plans[0], initial);
  verifyMonitoringExpenseResult(plans, [result]);
  assert.equal(projectExpenseTotal(result), 8300);
  assert.equal(result.expenses.find((expense) => expense.id === "balance").workbook_balance.amount, 0);
  assert.equal(buildMonitoringExpensePlans([incoming], [result]).plans[0].commands.length, 0);

  // A stopped run may already have inserted expenses but not yet settled the balance.
  const interrupted = apply(plans[0], initial, 2);
  assert.equal(projectExpenseTotal(interrupted), 16600);
  const resume = buildMonitoringExpensePlans([incoming], [interrupted]).plans[0];
  assert.equal(resume.added.length, 0);
  assert.equal(resume.replacedBalance, 8300);
  const resumed = apply(resume, interrupted);
  assert.equal(projectExpenseTotal(resumed), 8300);
  assert.equal(buildMonitoringExpensePlans([incoming], [resumed]).plans[0].commands.length, 0);
});

test("new costs beyond the existing balance remain real expenses; equal-price purchases stay distinct", () => {
  const initial = project("WAREHOUSE CORRALEA AVE", [balance(100), item(1, "Data cable", 200, { invoice_number: "OR-1" })]);
  const incoming = sheet("WAREHOUSE -CORRALES AVE.", [item(12, "Data cable", 200, { invoice_number: "OR-1" }), item(13, "Data cable", 250, { invoice_number: "OR-2" })]);
  const plan = buildMonitoringExpensePlans([incoming], [initial]).plans[0];
  assert.equal(plan.matched, 1);
  assert.equal(plan.added.length, 1);
  assert.equal(plan.expectedTotal, 450);
  assert.equal(projectExpenseTotal(apply(plan, initial)), 450);
  const changed = apply(plan, initial);
  changed.expenses.find((expense) => expense.id === "item-13").amount = 251;
  assert.throws(() => buildMonitoringExpensePlans([incoming], [changed]), /Imported expense changed/);
});

test("combined invoices and Royal payroll detail are not imported twice", () => {
  const cctv = sheet("CVH-CCTV NETWORK", [item(12, "CCTV NVR cameras", 83750, { invoice_number: "SF-1" }), item(13, "CCTV NVR cameras", 19110, { invoice_number: "SF-2" })]);
  const existing = project("CVH- CCTV NETWORK", [item(1, "CCTV NVR cameras", 102860, { invoice_number: "SF-1" })]);
  const plan = buildMonitoringExpensePlans([cctv], [existing]).plans[0];
  assert.equal(plan.added.length, 0);
  assert.equal(plan.commands[0].value.workbook_items.length, 2);
  assert.equal(projectExpenseTotal(apply(plan, existing)), 102860);
  const royal = sheet("ROYAL CABLE PSA CONDUIT", [item(18, "Rico Kevin Garder", 500), item(19, "Patrick Laput", 500), item(33, "Rico Kevin Garder", 704), item(34, "Patrick Laput", 500), item(47, "Rico Kevin Garder", 500), item(48, "Patrick Laput", 581.25)]);
  const grouped = groupMonitoringExpenses(royal);
  assert.deepEqual(grouped.map((expense) => expense.amount), [1000, 1204, 1081.25]);
  assert.equal(grouped.flatMap((expense) => expense.workbook_items).length, 6);
});

test("Bulua's verified half-peso correction replaces its balance and preserves the original entry", () => {
  const initial = project("BULUA", [item(1, "Stranded Wire #8 &14", 1582, { invoice_number: "1993" }), balance(0.5)]);
  const incoming = sheet("BULUA", [item(25, "Stranded Wire #8 & 14", 1582.5, { invoice_number: "19993" })]);
  const plan = buildMonitoringExpensePlans([incoming], [initial]).plans[0];
  assert.equal(plan.added.length, 0);
  assert.equal(plan.corrections.length, 1);
  assert.equal(plan.expectedTotal, 1582.5);
  const result = apply(plan, initial);
  assert.equal(result.expenses[0].id, "item-1");
  assert.equal(result.expenses[0].amount, 1582.5);
  assert.equal(result.expenses[0].source_previous_values.amount, 1582);
  assert.equal(buildMonitoringExpensePlans([incoming], [result]).plans[0].commands.length, 0);
  const update = normalizeMutation({ kind: "expense", value: { ...result.expenses[0], id: "11111111-1111-4111-8111-111111111111", date: "2026-07-24", method: "Cash", description: "Updated" } });
  const protectedExpense = { ...result.expenses[0], id: update.value.id };
  const preserved = protectWorkbookBalances(update, { ...result, expenses: [protectedExpense] });
  assert.equal(preserved.value.workbook_source.sha256, source.sha256);
  assert.equal(preserved.value.workbook_import_delta, 0.5);
});

test("Fullybooked is held, source amount text is recognized and invalid dates are not invented", () => {
  const result = buildMonitoringExpensePlans([sheet("FULLYBOOKED KETKAI", [item(12, "Invoice", 38145), item(13, "Invoice", 1000)])], []);
  assert.equal(result.plans.length, 0);
  assert.equal(result.held[0].amount, 39145);
  assert.equal(readAmount("15.904.00"), 15904);
  assert.equal(readAmount("₱42,000.00"), 42000);
  assert.equal(readAmount("Absent"), null);
  assert.equal(expenseDate("January 15,202696"), "");
  assert.equal(expenseDate("July 03 & 05,2026"), "");
  assert.equal(expenseDate("APRIIL18,2026"), "2026-04-18");
  assert.throws(() => readAmount("unconfirmed"), /Invalid expense/);
});
