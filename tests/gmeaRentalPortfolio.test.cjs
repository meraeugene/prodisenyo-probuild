const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");
const { summarizeRentalPortfolio, buildRentalLocations, filterRentalLocations } = load("features/gmea-rentals/utils/rentalPortfolioSelectors.ts");
const payment = (amount, payment_type, status = "posted") => ({ amount, payment_type, status });
const rental = (id, location, payments = [], extra = {}) => ({ id, client: "Customer", location, rental_number: id,
  status: "active", items: [{ subtotal: 1000 }], payments, ...extra });
const expense = (rental_id, amount, extra = {}) => ({ rental_id, amount, vat_mode: "off", vat_rate: 0, refunded_amount: 0, ...extra });

test("all-time totals separate payment types, ignore voids and preserve each rental's receivable", () => {
  const rows = [rental("a", "Bayanga", [payment(200, "down_payment"), payment(500, "full_payment"),
    payment(50, "partial_payment"), payment(25), payment(100, "down_payment", "voided")]),
    rental("b", "Bayanga", [payment(1500, "full_payment")]), rental("draft", "Cugman", [], { status: "draft" }),
    rental("cancelled", "Cugman", [], { status: "cancelled" })];
  const totals = summarizeRentalPortfolio(rows, [expense(null, 100, { vat_mode: "exclusive", vat_rate: 12, refunded_amount: 12 })]);
  assert.equal(totals.charge, 2000);
  assert.equal(totals.downPayment, 200);
  assert.equal(totals.fullPayment, 2000);
  assert.equal(totals.otherPayments, 75);
  assert.equal(totals.collected, 2275);
  assert.equal(totals.outstanding, 225);
  assert.equal(totals.expenses, 100);
});

test("unknown historical charges remain unconfirmed while posted receipts still count", () => {
  const totals = summarizeRentalPortfolio([rental("history", "Tagoloan", [payment(250, "down_payment")],
    { historical: { charge: null } })], []);
  assert.equal(totals.charge, 0);
  assert.equal(totals.outstanding, 0);
  assert.equal(totals.unconfirmedCharges, 1);
  assert.equal(totals.collected, 250);
  const zero = summarizeRentalPortfolio([rental("zero", "Tagoloan", [], { historical: { charge: 0 } })], []);
  assert.equal(zero.unconfirmedCharges, 0);
});

test("location details group repeated jobs and link only their expenses; general expenses stay in overall totals", () => {
  const rows = [rental("a", "Bayanga"), rental("b", " bayanga ", [], { client: "Second customer" }),
    rental("c", "Cugman"), rental("d", "", [], { client: "Third customer" }), rental("e", "", [], { client: "Fourth customer" })];
  const expenses = [expense("a", 100), expense("b", 200), expense("c", 400), expense(null, 800), expense("missing", 1600)];
  const locations = buildRentalLocations(rows, expenses);
  assert.equal(locations.length, 4);
  const bayanga = locations.find(row => row.name === "Bayanga");
  assert.equal(bayanga.rentals.length, 2);
  assert.equal(bayanga.summary.expenses, 300);
  assert.equal(summarizeRentalPortfolio(rows, expenses).expenses, 3100);
  assert.equal(filterRentalLocations(locations, "Second CUSTOMER")[0].key, bayanga.key);
  assert.equal(filterRentalLocations(locations, " cugman ").length, 1);
});
