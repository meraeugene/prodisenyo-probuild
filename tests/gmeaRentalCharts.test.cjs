const test = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/loadGmeaModule.cjs");
const charts = load("features/gmea-rentals/utils/rentalChartSelectors.ts");
const income = load("features/gmea-rentals/utils/rentalIncomeSelectors.ts");
const weeks = load("features/gmea-rentals/utils/rentalReportingWeeks.ts");

const payment = (amount, date, type, status = "posted") => ({ id: date + amount, amount, payment_date: date, payment_type: type, status, recorded_at: "" });
const rentals = [
  { id: "a", client: "Alpha", location: "Manila", rental_number: "R-1", items: [], payments: [payment(100.1, "2026-01-03", "down_payment"), payment(200.2, "2026-01-03", "full_payment"), payment(10, "2026-01-05", undefined), payment(900, "2026-01-04", "full_payment", "voided"), payment(50, "2025-12-20", "down_payment")] },
  { id: "b", client: "Beta", location: "Cebu", rental_number: "R-2", items: [], payments: [payment(70, "2026-01-04", "partial_payment")] },
];
test("income charts reconcile to posted collections and honor company filters across year boundaries", () => {
  const filtered = income.selectRentalIncomeRentals(rentals, "", "alpha");
  const trend = charts.buildRentalIncomeTrend(filtered, "2026-01");
  assert.equal(trend.length, 6);
  assert.equal(trend[0].label, "Aug 25");
  assert.equal(trend[4].collected, 50);
  assert.equal(trend[5].collected, 310.3);
  assert.equal(trend[5].otherPayments, 10);
  const daily = charts.buildRentalIncomeDays(filtered, "2026-01");
  assert.equal(daily.length, 31);
  assert.equal(daily[2].collected, 300.3);
  assert.equal(daily[3].collected, 0);
  assert.equal(Math.round(daily.reduce((sum, day) => sum + day.collected, 0) * 100), 31030);
  assert.equal(charts.buildRentalIncomeDays([], "2024-02").length, 29);
  assert.deepEqual(charts.buildRentalIncomeTrend(rentals, "2026-13"), []);
});
test("expense charts use reporting month for cross-month cutoffs and deduct refunds after VAT", () => {
  const expense = { id: "expense", notes: weeks.encodeRentalWeekNotes("", { month: "2026-09", start: "2026-09-28", end: "2026-10-03", section: "equipment", party: "Truck" }), date: "2026-10-02", amount: 1000, vat_mode: "exclusive", vat_rate: 12, refunded_amount: 120 };
  const reporting = weeks.buildRentalReportingWeeks([expense]);
  assert.equal(charts.buildRentalExpenseTrend(reporting, "2026-10")[4].total, 1000);
  assert.equal(charts.buildRentalExpenseTrend(reporting, "2026-10")[5].total, 0);
  assert.equal(charts.buildRentalExpenseWeeks(reporting, "2026-09")[0].equipment, 1000);
  assert.deepEqual(charts.buildRentalExpenseWeeks(reporting, "2026-10"), []);
});
test("booking chart counts rental starts once, with draft and cancelled counts separated", () => {
  const rows = [{ start_date: "2026-01-31", end_date: "2026-02-10", status: "active" }, { start_date: "2026-01-02", status: "draft" }, { start_date: "2026-01-03", status: "cancelled" }, { start_date: "2026-02-01", status: "completed" }];
  const data = charts.buildRentalBookingTrend(rows, "2026-02");
  assert.deepEqual(data[4], { label: "Jan 26", active: 1, completed: 0, draft: 1, cancelled: 1 });
  assert.deepEqual(data[5], { label: "Feb 26", active: 0, completed: 1, draft: 0, cancelled: 0 });
  assert.deepEqual(charts.buildRentalBookingTrend(rows.filter(row => row.status === "active"), "2026-02")[4], { label: "Jan 26", active: 1, completed: 0, draft: 0, cancelled: 0 });
});
