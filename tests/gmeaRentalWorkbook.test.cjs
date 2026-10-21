const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");
const { buildRentalIncomeRows, selectRentalIncomeRows, getRentalExpenseType } = load("features/gmea-rentals/utils/rentalWorkbookRecords.ts");
const { buildRentalCutoffDefault } = load("features/gmea-rentals/utils/rentalCutoffDefaults.ts");
const { encodeRentalWeekNotes } = load("features/gmea-rentals/utils/rentalReportingWeeks.ts");
const { normalizeRentalExpenseMutation } = load("features/gmea-rentals/utils/operationsValidation.ts");
const uuid = "a0000000-0000-4000-8000-000000000001";

test("income payment-type tabs filter receipt rows and retain entries that have no confirmed payment", () => {
  const rental = (id, payments) => ({ id, client: "Harbor", location: "Gusa", rental_number: id, items: [{ equipment_name: "Backhoe rental" }], payments });
  const pay = (id, payment_type, status = "posted") => ({ id, payment_type, status, payment_date: "2026-05-09", method: "GCash" });
  const rows = buildRentalIncomeRows([rental("a", [pay("dp", "down_payment"), pay("fp", "full_payment"), pay("void", "full_payment", "voided")]), rental("b", [])]);
  assert.equal(rows.length, 3);
  assert.equal(selectRentalIncomeRows(rows, "down_payment", "backhoe", "harbor", "gusa").length, 1);
  assert.equal(selectRentalIncomeRows(rows, "full_payment", "gcash", "", "")[0].payment.id, "fp");
  assert.equal(selectRentalIncomeRows(rows, "other", "", "", "")[0].rental.id, "b");
  assert.equal(selectRentalIncomeRows(rows, "all", "", "different", "").length, 0);
});

test("expense tabs follow workbook section metadata before category/equipment fallback", () => {
  const notes = encodeRentalWeekNotes("Salary", buildRentalCutoffDefault("2026-10-01", "salary"));
  const categories = new Map([["fuel", "Diesel/Fuel"], ["advance", "Cash Advance"], ["salary", "Driver"]]);
  assert.equal(getRentalExpenseType({ notes, category_id: "fuel" }, categories), "salary");
  assert.equal(getRentalExpenseType({ notes: "", category_id: "advance" }, categories), "cash-advance");
  assert.equal(getRentalExpenseType({ notes: "", category_id: "salary" }, categories), "salary");
  assert.equal(getRentalExpenseType({ notes: "", category_id: "fuel", equipment_id: uuid }, categories), "equipment");
  assert.equal(getRentalExpenseType({ notes: "", category_id: "fuel" }, categories), "general");
});

test("expense search finds workbook payees even when the legacy supplier field is blank", () => {
  const { selectRentalExpenseRows } = load("features/gmea-rentals/utils/rentalExpensePeriods.ts");
  const expense = { notes: encodeRentalWeekNotes("", { ...buildRentalCutoffDefault("2026-10-01", "salary"), party: "Operators" }), description: "Salary", supplier: "", invoice_number: "", method: "Cash" };
  assert.equal(selectRentalExpenseRows([expense], null, "operators", "", "", new Map()).length, 1);
});

test("shared rental table distinguishes income and expense and links expenses to customer records", () => {
  const { buildRentalTransactions, selectRentalTransactions } = load("features/gmea-rentals/utils/rentalTransactions.ts");
  const rental = { id: uuid, client: "Customer", location: "Gusa", rental_number: "Manual entry", items: [{ equipment_name: "Backhoe" }], payments: [{ id: "dp", status: "posted", payment_type: "down_payment", payment_date: "2026-10-01", method: "Cash" }] };
  const expense = { id: "cost", rental_id: null, income_record_id: uuid, date: "2026-10-02", description: "Fuel", supplier: "Supplier", method: "Cash", invoice_number: "", notes: "" };
  const rows = buildRentalTransactions([rental], [expense]);
  assert.equal(rows.length, 2);
  assert.equal(selectRentalTransactions(rows, "expense", "all", "fuel", "customer", "gusa")[0].expense.id, "cost");
  assert.equal(selectRentalTransactions(rows, "income", "all", "", "", "")[0].payment.id, "dp");
  assert.equal(selectRentalTransactions(rows, "all", "down_payment", "", "", "").length, 1);
  assert.equal(selectRentalTransactions(buildRentalTransactions([rental], []), "expense", "all", "", "", "").length, 0);
});

test("new reporting cutoff retains cross-month dates and linked salaries validate without equipment", () => {
  const week = buildRentalCutoffDefault("2026-10-01", "salary");
  assert.equal(week.start, "2026-09-28");
  assert.equal(week.end, "2026-10-04");
  assert.equal(week.month, "2026-09");
  assert.throws(() => buildRentalCutoffDefault("2026-02-30", "salary"), /valid expense date/);
  const value = { id: uuid, rental_id: uuid, equipment_id: null, category_id: uuid, date: "2026-10-01", description: "Salary", supplier: "Drivers", method: "Cash", invoice_number: "", amount: 100, refunded_amount: 0, vat_mode: "off", notes: encodeRentalWeekNotes("Paid", week), version: 1 };
  assert.equal(normalizeRentalExpenseMutation({ kind: "create", value }).value.rental_id, uuid);
  assert.throws(() => normalizeRentalExpenseMutation({ kind: "create", value: { ...value, equipment_id: uuid } }), /payee without equipment/);
  assert.throws(() => normalizeRentalExpenseMutation({ kind: "create", value: { ...value, date: "2026-10-05" } }), /within the selected week/);
});

test("month options and records run from earliest to latest and undated records stay last", () => {
  const { selectRentalTransactions, rentalTransactionMonths } = load("features/gmea-rentals/utils/rentalTransactions.ts");
  const row = (id, date) => ({ id, date, type: "expense", rental: null, expense: { date, description: "Fuel", supplier: "", method: "", invoice_number: "", notes: "" } });
  const rows = [row("unknown", ""), row("jan", "2026-01-01"), row("dec", "2025-12-31"), row("later", "2026-01-31")];
  assert.deepEqual(selectRentalTransactions(rows, "all", "all", "", "", "").map(row => row.id), ["dec", "jan", "later", "unknown"]);
  assert.deepEqual(rows.map(row => row.id), ["unknown", "jan", "dec", "later"]);
  assert.deepEqual(rentalTransactionMonths(rows), [
    { value: "2025-12", label: "December 2025" }, { value: "2026-01", label: "January 2026" }, { value: "undated", label: "Undated records" },
  ]);
});

test("month filtering keeps cross-month expenses under their reporting cutoff and uses receipt dates for income", () => {
  const { buildRentalTransactions, selectRentalTransactions } = load("features/gmea-rentals/utils/rentalTransactions.ts");
  const rental = { id: uuid, client: "Customer", location: "Gusa", rental_number: "Rental", items: [], payments: [
    { id: "paid", status: "posted", payment_date: "2026-10-01", method: "Cash" },
  ] };
  const notes = encodeRentalWeekNotes("", buildRentalCutoffDefault("2026-10-01", "equipment"));
  const expense = { id: "cost", rental_id: null, date: "2026-10-02", description: "Fuel", supplier: "Supplier", method: "Cash", invoice_number: "", notes };
  const rows = buildRentalTransactions([rental, { ...rental, id: "undated", payments: [] }], [expense]);
  const select = (type, month) => selectRentalTransactions(rows, type, "all", "", "", "", month);
  assert.equal(select("all", "2026-10").length, 1);
  assert.equal(select("expense", "2026-09")[0].expense.id, "cost");
  assert.equal(select("income", "2026-10")[0].payment.id, "paid");
  assert.equal(select("all", "2026-09").length, 1);
  assert.equal(select("all", "undated")[0].rental.id, "undated");
  assert.equal(select("expense", "undated").length, 0);
});
