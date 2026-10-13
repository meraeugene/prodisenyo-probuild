const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");
const fs = require("node:fs");
const { buildGmeaDashboardSummary, buildGmeaDashboardTrend } = load("features/gmea-dashboard/utils/gmeaDashboardSelectors.ts");
const payment = (amount, payment_type, status = "posted") => ({ amount, payment_type, status, payment_date: "2026-05-09" });
const cost = (amount, extra = {}) => ({ amount, date: "2026-05-09", vat_mode: "off", vat_rate: 0, refunded_amount: 0, ...extra });
const data = () => ({
  rentalIncome: [
    { id: "a", client: "Company", location: "Gusa", status: "active", items: [{ subtotal: 1000 }], payments: [payment(200, "down_payment"), payment(500, "full_payment"), payment(300, "full_payment", "voided")] },
    { id: "archive", client: "Company", location: " gusa ", status: "active", items: [], historical: { charge: null }, payments: [payment(250, "down_payment")] },
  ],
  rentalExpenses: [cost(100, { vat_mode: "exclusive", vat_rate: 12, refunded_amount: 12 })],
  operationExpenses: [cost(50.25)],
  projects: [{ id: "p", status: "active", contract_amount: 2000, tax_rate: 0,
    expenses: [cost(100, { vat_mode: "exclusive", vat_rate: 12, refunded_amount: 100 })],
    payment_terms: [{ amount: 2000, receipts: [{ amount: 500, received_date: "2026-05-09", status: "posted" }, { amount: 100, received_date: "2026-05-09", status: "voided" }], imported_receipts: [{ amount: 250, received_date: null }] }],
  }],
});

test("dashboard route is protected for GMEA and CEO in matcher, middleware, and page", () => {
  assert.match(fs.readFileSync("proxy.ts", "utf8"), /gmea-dashboard\/:path\*/);
  assert.match(fs.readFileSync("lib/supabase/middleware.ts", "utf8"), /GMEA_WORKSPACE_PREFIXES[^\n]+gmea-dashboard/);
  assert.match(fs.readFileSync("app/(dashboard)/gmea-dashboard/page.tsx", "utf8"), /requireRole\(\[APP_ROLES.GMEA, APP_ROLES.CEO\]\)/);
});

test("dashboard combines actual receipts and all three expense areas without counting rental charges as income", () => {
  const summary = buildGmeaDashboardSummary(data());
  assert.equal(summary.rentalCollected, 950);
  assert.equal(summary.projectCollected, 750);
  assert.equal(summary.collected, 1700);
  assert.equal(summary.rentalExpenses, 100);
  assert.equal(summary.projectExpenses, 112, "reimbursing the payer does not reverse project costs");
  assert.equal(summary.operationExpenses, 50.25);
  assert.equal(summary.expenses, 262.25);
  assert.equal(summary.net, 1437.75);
  assert.equal(summary.outstanding, 1550);
  assert.equal(summary.downPayment, 450);
  assert.equal(summary.fullPayment, 500);
  assert.equal(summary.locationCount, 1);
});

test("monthly chart uses dated transactions; undated imported project receipts remain only in overall totals", () => {
  const trend = buildGmeaDashboardTrend(data(), "2026-05", 2);
  assert.deepEqual(trend.map(row => row.key), ["2026-04", "2026-05"]);
  assert.equal(trend[0].collected, 0);
  assert.equal(trend[1].collected, 1450);
  assert.equal(trend[1].expenses, 262.25);
  assert.equal(trend[1].net, 1187.75);
  assert.deepEqual(buildGmeaDashboardTrend(data(), "2026-13"), []);
});

test("empty dashboard stays zero and a cross-month rental cutoff follows its actual expense date in the chart", () => {
  const empty = { projects: [], rentalIncome: [], rentalExpenses: [], operationExpenses: [] };
  assert.equal(buildGmeaDashboardSummary(empty).net, 0);
  const { encodeRentalWeekNotes } = load("features/gmea-rentals/utils/rentalReportingWeeks.ts");
  empty.rentalExpenses = [cost(10, { date: "2026-10-02", notes: encodeRentalWeekNotes("", { month: "2026-09", start: "2026-09-28", end: "2026-10-04", section: "salary", party: "Drivers" }) })];
  const trend = buildGmeaDashboardTrend(empty, "2026-10", 2);
  assert.equal(trend[0].expenses, 0);
  assert.equal(trend[1].expenses, 10);
});
