const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");
const { rentalExpensePeriodRange: range, selectRentalExpenseRows: select, summarizeRentalExpenses: summarize, latestRentalExpenseDate: latest } = load("features/gmea-rentals/utils/rentalExpensePeriods.ts");
const { deduplicate, flagCrossPeriodIssues } = require("../scripts/lib/rentalHistoryRecordReview.cjs");

const expense = (id, date, overrides = {}) => ({ id, date, rental_id: null, equipment_id: null,
  category_id: "fuel", description: "Fuel", supplier: "Supplier", method: "Cash", invoice_number: "INV-1",
  amount: 100, refunded_amount: 0, vat_mode: "off", vat_rate: 0, notes: "", version: 1,
  created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z", ...overrides });

test("monthly periods include leap days and stay correct across year boundaries", () => {
  assert.deepEqual(range("month", "2028-02-15"), { start: "2028-02-01", end: "2028-02-29" });
  assert.deepEqual(range("month", "2026-12-31"), { start: "2026-12-01", end: "2026-12-31" });
  assert.equal(range("month", "2026-02-30"), null);
  assert.equal(range("week", ""), null);
  assert.equal(range("all", ""), null);
});

test("weekly periods include Monday through Sunday, even across months and years", () => {
  for (const date of ["2026-09-28", "2026-10-04"]) assert.deepEqual(range("week", date), { start: "2026-09-28", end: "2026-10-04" });
  assert.deepEqual(range("week", "2027-01-01"), { start: "2026-12-28", end: "2027-01-03" });
});

test("expense date controls period membership and monthly totals contain every row once", () => {
  const rows = [expense("before", "2026-09-27"), expense("start", "2026-09-28"), expense("middle", "2026-10-01"), expense("end", "2026-10-04"), expense("after", "2026-10-05")];
  const week = select(rows, range("week", "2026-10-01"), "", "", "", new Map());
  assert.deepEqual(week.map(row => row.id), ["end", "middle", "start"]);
  assert.equal(summarize(week).gross, 300);
  const september = select(rows, range("month", "2026-09-01"), "", "", "", new Map());
  const october = select(rows, range("month", "2026-10-01"), "", "", "", new Map());
  assert.equal(summarize(september).gross + summarize(october).gross, summarize(rows).gross);
  assert.equal(latest(rows, "2026-01-01"), "2026-10-05");
  assert.equal(latest([], "2026-10-09"), "2026-10-09");
});

test("search, category and equipment filters narrow expenses together", () => {
  const rows = [expense("one", "2026-10-01", { equipment_id: "truck" }), expense("two", "2026-10-02", { category_id: "salary" })];
  const names = new Map([["truck", "Yellow Dump Truck"]]);
  assert.deepEqual(select(rows, null, " YELLOW ", "fuel", "truck", names).map(row => row.id), ["one"]);
  assert.deepEqual(select(rows, null, "inv-1", "salary", "general", names).map(row => row.id), ["two"]);
  assert.equal(select(rows, null, "yellow", "salary", "", names).length, 0);
});

test("period summaries handle VAT, refunds and fractional amounts in cents", () => {
  const totals = summarize([expense("one", "2026-10-01", { amount: 100, vat_mode: "exclusive", vat_rate: 12, refunded_amount: 12 }),
    expense("two", "2026-10-02", { amount: 112, vat_mode: "inclusive", vat_rate: 12 }),
    expense("three", "2026-10-03", { amount: 0.1 }), expense("four", "2026-10-04", { amount: 0.2 })]);
  assert.deepEqual(totals, { gross: 224.3, vat: 24, refunded: 12, net: 212.3 });
  assert.deepEqual(summarize([]), { gross: 0, vat: 0, refunded: 0, net: 0 });
});

const sourceRow = overrides => ({ sourceMonth: "2026-09-01", date: "2026-09-05", amount: 6650,
  kind: "weekly-adjustment", equipment: null, category: "Operator", rawDescription: "Salary - OPERATORS", issues: [], ...overrides });

test("cross-month copies are held on both sides without silently deleting expenses", () => {
  const rows = [sourceRow({}), sourceRow({ sourceMonth: "2026-10-01" }), sourceRow({ sourceMonth: "2026-10-01", amount: 6600 })];
  assert.equal(flagCrossPeriodIssues(rows).length, 1);
  assert.ok(rows[0].issues.includes("possible duplicate across reporting months"));
  assert.ok(rows[1].issues.includes("possible duplicate across reporting months"));
  assert.deepEqual(rows[2].issues, []);
  assert.equal(rows.length, 3);
});

test("wrong-year dates and inferred corrections require review while calendar rollover remains valid", () => {
  const rows = [sourceRow({ date: "2025-01-08", sourceMonth: "2026-01-01" }),
    sourceRow({ date: "2025-12-31", sourceMonth: "2026-01-01" }),
    sourceRow({ dateCorrection: "Feb31 -> Jan31" })];
  flagCrossPeriodIssues(rows);
  assert.deepEqual(rows[0].issues, ["date: transaction year differs from worksheet year"]);
  assert.deepEqual(rows[1].issues, []);
  assert.deepEqual(rows[2].issues, ["date: inferred correction requires confirmation"]);
  assert.equal(rows[0].date, "2025-01-08");
});

test("exact weekly repeats are skipped but conflicting amounts remain blocked", () => {
  const rows = [sourceRow({ sourceLocator: "sheet!A1" }), sourceRow({ sourceLocator: "sheet!A2" })];
  assert.equal(deduplicate(rows).duplicates.length, 1);
  const result = deduplicate([sourceRow({}), sourceRow({ amount: 6500 })]);
  assert.equal(result.records.length, 2);
  assert.ok(result.records.every(row => row.issues.includes("conflicting duplicate/revision in weekly sheet")));
});

test("unmapped equipment headings are not mistaken for the same asset", () => {
  const rows = [sourceRow({ rawEquipment: "ANA" }), sourceRow({ rawEquipment: "ESTRADA", sourceMonth: "2026-10-01" })];
  assert.equal(flagCrossPeriodIssues(rows).length, 0);
});

test("expense ledger renders full-period totals before pagination and CEO receives view controls", () => {
  const React = require("react"), { renderToStaticMarkup } = require("react-dom/server");
  const Ledger = load("features/gmea-rentals/components/GmeaRentalExpenseLedger.tsx", {
    "@/components/workspace/workspace.module.css": { default: {} }, "./workspace.module.css": { default: {} }, "./rentalExpenseLedger.module.css": { default: {} },
    "./GmeaRentalExpenseForm": { default: () => null },
  }).default;
  const operations = { categories: [{ id: "fuel", name: "Fuel", is_active: true, sort_order: 0 }],
    equipment: [], workers: [], expenses: Array.from({ length: 11 }, (_, i) => expense(String(i), "2026-10-01", { description: `Expense ${i}` })) };
  const html = renderToStaticMarkup(React.createElement(Ledger, { operations, rentals: [], canEdit: false }));
  assert.ok(html.includes("Monthly") && html.includes("Weekly") && html.includes("All dates"));
  assert.ok(html.includes("₱1,100.00"));
  assert.ok(html.includes(">Details</button>"));
  assert.ok(!html.includes("New expense") && !html.includes(">Edit</button>"));
  assert.ok(html.replace(/<!--.*?-->/g, "").includes("1–10 of 11 expenses"));
});

test("general expense form opens without a rental and CEO details are disabled", () => {
  const React = require("react"), { renderToStaticMarkup } = require("react-dom/server");
  const Form = load("features/gmea-rentals/components/GmeaRentalExpenseForm.tsx", {
    "./useGmeaRentalOperationsMutation": { useGmeaRentalOperationsMutation: () => ({ pending: false, error: "", saveExpense: async () => {} }) },
    "../hooks/useGmeaRentalOperationsMutation": { useGmeaRentalOperationsMutation: () => ({ pending: false, error: "", saveExpense: async () => {} }) },
    "./GmeaRentalsDialog": { default: ({ children, title }) => React.createElement("section", {}, React.createElement("h2", {}, title), children) },
  }).default;
  const html = renderToStaticMarkup(React.createElement(Form, { equipment: [], categories: [], expense: expense("one", "2026-10-01"), readOnly: true, onClose: () => {} }));
  assert.ok(html.includes("Rental expense details"));
  assert.ok(html.includes("<fieldset disabled="));
  assert.ok(!html.includes("This rental"));
  assert.ok(html.includes("General Rentals operations"));
});
