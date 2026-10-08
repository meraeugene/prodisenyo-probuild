const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");
const { buildGmeaOverviewCollections } = load("features/gmea-overview/utils/gmeaOverviewCollections.ts");

const receipt = (amount, status = "posted") => ({ amount, status });
const project = (status, amount, taxRate, receipts) => ({
  status, contract_amount: amount, tax_rate: taxRate,
  payment_terms: [{ amount, receipts }],
});
const rental = (id, amount, status = "active") => ({ id, status, items: [{ subtotal: amount }] });
const payment = (id, amount, status = "posted") => ({ rental_id: id, amount, status });

test("dashboard collections include both project statuses, tax, and posted rental payments", () => {
  const data = {
    projects: [
      project("active", 1000, 12, [receipt(500), receipt(100, "voided")]),
      project("completed", 2000, 5, [receipt(1000)]),
    ],
    rentals: {
      rentals: [rental("a", 1000), rental("b", 300, "completed"), rental("c", 900, "cancelled")],
      payments: [payment("a", 200), payment("a", 100, "voided"), payment("b", 300)],
    },
  };
  const before = structuredClone(data);
  assert.deepEqual(buildGmeaOverviewCollections(data), { totalCollected: 2000, notCollected: 2520 });
  assert.deepEqual(data, before);
});

test("overpaid records cannot reduce another record's uncollected balance", () => {
  assert.deepEqual(buildGmeaOverviewCollections({
    projects: [project("completed", 100, 0, [receipt(150)]), project("active", 200, 0, [])],
    rentals: {
      rentals: [rental("a", 100), rental("b", 200)],
      payments: [payment("a", 150)],
    },
  }), { totalCollected: 300, notCollected: 400 });
});

test("empty collection totals are zero", () => {
  assert.deepEqual(buildGmeaOverviewCollections({ projects: [], rentals: { rentals: [], payments: [] } }),
    { totalCollected: 0, notCollected: 0 });
});
