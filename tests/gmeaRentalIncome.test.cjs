const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");
const { selectRentalIncomeTransactions, summarizeRentalIncome, rentalOutstandingAtMonthEnd,
  buildRentalIncomeCompanies, latestRentalIncomeMonth } = load("features/gmea-rentals/utils/rentalIncomeSelectors.ts");
const { normalizeRentalCollectionMutation } = load("features/gmea-rentals/utils/collectionValidation.ts");
const { readAllRentalRows } = load("features/gmea-rentals/server/readAllRentalRows.ts", { "server-only": {} });

function payment(id, amount, payment_date, payment_type, status = "posted") {
  return { id, amount, payment_date, payment_type, status, recorded_at: payment_date + "T08:00:00Z" };
}
function rental(id, client, payments, extra = {}) {
  return { id, client, location: "Bayanga", rental_number: id, status: "active", start_date: "2026-04-01",
    items: [{ subtotal: 50000, equipment_name: "Backhoe" }], payments, ...extra };
}

test("income follows receipt months rather than rental start dates and excludes voided receipts", () => {
  const rows = [rental("job-1", "Jessie", [payment("dp", 25000, "2026-04-30", "down_payment"),
    payment("fp", 25000, "2026-05-01", "full_payment"), payment("void", 10000, "2026-05-02", "down_payment", "voided")])];
  assert.equal(summarizeRentalIncome(selectRentalIncomeTransactions(rows, "2026-04")).downPayment, 25000);
  assert.equal(summarizeRentalIncome(selectRentalIncomeTransactions(rows, "2026-05")).fullPayment, 25000);
  assert.equal(summarizeRentalIncome(selectRentalIncomeTransactions(rows, "2026-05")).collected, 25000);
  assert.equal(rentalOutstandingAtMonthEnd(rows[0], "2026-04"), 25000);
  assert.equal(rentalOutstandingAtMonthEnd(rows[0], "2026-05"), 0);
  assert.equal(latestRentalIncomeMonth(rows, "2026-10"), "2026-05");
  assert.deepEqual(selectRentalIncomeTransactions(rows, ""), []);
  assert.deepEqual(selectRentalIncomeTransactions(rows, "2026-13"), []);
});

test("companies normalize case and spacing, preserve repeated jobs and include unclassified and partial amounts once", () => {
  const rows = [rental("job-1", "MR Depot", [payment("a", 100.1, "2026-05-01", undefined)]),
    rental("job-2", " MR  DEPOT ", [payment("b", 200.2, "2026-05-02", "partial_payment")]),
    rental("job-3", "Another company", [payment("c", 500, "2026-04-01", "full_payment")])];
  const summary = summarizeRentalIncome(selectRentalIncomeTransactions(rows, "2026-05"));
  assert.equal(summary.collected, 300.3);
  assert.equal(summary.otherPayments, 300.3);
  assert.equal(summary.downPayment, 0);
  assert.equal(summary.fullPayment, 0);
  assert.equal(summary.unclassifiedCount, 1);
  assert.equal(summary.companies, 1);
  const companies = buildRentalIncomeCompanies(rows, "2026-05");
  assert.equal(companies.length, 2);
  assert.equal(companies[0].rentals.length, 2);
  assert.equal(companies[0].collected, 300.3);
  assert.equal(companies[1].collected, 0);
});

test("month-end balances exclude later rentals, drafts and cancelled jobs, and stop at zero", () => {
  const base = rental("job", "Client", [payment("p", 1000, "2026-06-01", "down_payment")]);
  assert.equal(rentalOutstandingAtMonthEnd(base, "2026-05"), 50000);
  assert.equal(rentalOutstandingAtMonthEnd({ ...base, start_date: "2026-06-01" }, "2026-05"), 0);
  for (const status of ["draft", "cancelled"]) assert.equal(rentalOutstandingAtMonthEnd({ ...base, status }, "2026-05"), 0);
  assert.equal(rentalOutstandingAtMonthEnd({ ...base, payments: [payment("over", 60000, "2026-05-01", "full_payment")] }, "2026-05"), 0);
});

test("payment validation retains explicit types, rejects invalid types and preserves legacy callers", () => {
  const value = { id: "11111111-1111-4111-8111-111111111111", amount: 25000, payment_date: "2025-05-01", method: "Cash", reference_number: "", notes: "" };
  for (const payment_type of ["down_payment", "full_payment", "partial_payment"]) {
    assert.equal(normalizeRentalCollectionMutation({ kind: "record_payment", value: { ...value, payment_type } }).value.payment_type, payment_type);
  }
  assert.equal(normalizeRentalCollectionMutation({ kind: "record_payment", value }).value.payment_type, "unclassified");
  assert.throws(() => normalizeRentalCollectionMutation({ kind: "record_payment", value: { ...value, payment_type: "bad" } }), /valid payment type/);
});

test("financial reads retain rentals and charges beyond the API's first page and surface page errors", async () => {
  const source = Array.from({ length: 1001 }, (_, index) => ({ id: index }));
  const calls = [];
  const rows = await readAllRentalRows(async (from, to) => { calls.push([from, to]); return { data: source.slice(from, to + 1), error: null }; }, "rentals");
  assert.equal(rows.length, 1001);
  assert.deepEqual(calls, [[0, 999], [1000, 1999]]);
  await assert.rejects(readAllRentalRows(async from => ({ data: from === 0 ? source.slice(0, 1000) : null,
    error: from === 0 ? null : { message: "Read failed" } }), "rentals"), /Read failed/);
});

test("typed payment action checks authorization and schema availability before saving", async () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const input = { kind: "record_payment", value: { id, amount: 100, payment_date: "2025-05-01", payment_type: "down_payment",
    method: "Cash", reference_number: "", notes: "" } };
  let authorized = false;
  let schemaError = { code: "42703", message: "column does not exist" };
  const calls = [];
  const paths = [];
  const actions = load("actions/gmeaRentals.ts", {
    "next/cache": { revalidatePath: path => paths.push(path) },
    "@/lib/auth": { APP_ROLES: { CEO: "ceo" } },
    "@/features/gmea-rentals/server/gmeaRentalsQueries": { requireGmeaRentalsAccess: async write => {
      assert.equal(write, true); if (!authorized) throw new Error("Forbidden"); return { user: { id } };
    } },
    "@/features/gmea-rentals/server/gmeaRentalsDatabase": { gmeaRentalsWriter: () => ({
      from(table) { calls.push(table); return { select(field) { assert.equal(field, "payment_type"); return this; },
        async limit() { return { error: schemaError }; } }; },
      async rpc(name, args) { calls.push([name, args]); return { data: id, error: null }; },
    }) },
  });
  await assert.rejects(actions.saveGmeaRentalCollectionAction(id, 1, input), /Forbidden/);
  assert.deepEqual(calls, []);
  authorized = true;
  await assert.rejects(actions.saveGmeaRentalCollectionAction(id, 1, input), /finish setting up rental income/);
  assert.equal(calls.length, 1);
  assert.deepEqual(paths, []);
  schemaError = null;
  await actions.saveGmeaRentalCollectionAction(id, 1, input);
  assert.equal(calls.at(-1)[1].p_command.value.payment_type, "down_payment");
  assert.ok(paths.includes("/gmea-rentals"));
});
