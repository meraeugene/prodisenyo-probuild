const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");
const id = "11111111-1111-4111-8111-111111111111";

function deletion({ allowed = true, data = { id }, error = null } = {}) {
  const calls = [], paths = [];
  const query = {
    delete() { calls.push(["delete"]); return this; },
    eq(field, value) { calls.push([field, value]); return this; },
    select(value) { calls.push(["select", value]); return this; },
    async maybeSingle() { return { data, error }; },
  };
  const actions = load("actions/gmeaRentalDeletion.ts", {
    "next/cache": { revalidatePath: path => paths.push(path) },
    "@/features/gmea-rentals/server/gmeaRentalsQueries": {
      requireGmeaRentalsAccess: async write => { assert.equal(write, true); if (!allowed) throw new Error("Forbidden"); },
    },
    "@/features/gmea-rentals/server/gmeaRentalsDatabase": {
      gmeaRentalsWriter: () => ({ from: table => { calls.push(["table", table]); return query; } }),
    },
  });
  return { ...actions, calls, paths };
}

test("rental and equipment deletion checks authorization before accessing privileged data", async () => {
  const action = deletion({ allowed: false });
  await assert.rejects(action.deleteGmeaRentalRecordAction("rental", id, 1), /Forbidden/);
  assert.deepEqual(action.calls, []);
});

test("deletion validates IDs, versions and record types", async () => {
  const action = deletion();
  for (const args of [["other", id, 1], ["rental", "invalid", 1], ["rental", id, 0], ["rental", id, 1.5]]) {
    await assert.rejects(action.deleteGmeaRentalRecordAction(...args));
  }
  assert.deepEqual(action.calls, []);
});

test("deletion targets the selected record and current version, and refreshes financial pages", async () => {
  for (const kind of ["rental", "equipment"]) {
    const action = deletion();
    assert.equal(await action.deleteGmeaRentalRecordAction(kind, id, 3), id);
    assert.deepEqual(action.calls, [["table", kind === "rental" ? "gmea_rentals" : "gmea_rental_equipment"], ["delete"], ["id", id], ["version", 3], ["select", "id"]]);
    assert.ok(action.paths.includes("/gmea-overview"));
    assert.ok(action.paths.includes("/gmea-rentals"));
  }
});

test("stale records and linked equipment fail without reporting successful deletion", async () => {
  const stale = deletion({ data: null });
  await assert.rejects(stale.deleteGmeaRentalRecordAction("rental", id, 1), /changed or was already deleted/);
  assert.deepEqual(stale.paths, []);
  const linked = deletion({ data: null, error: { code: "23503", message: "foreign key" } });
  await assert.rejects(linked.deleteGmeaRentalRecordAction("equipment", id, 1), /Deactivate it instead/);
  assert.deepEqual(linked.paths, []);
});

test("rental list includes payments so collected and outstanding match rental details", async () => {
  const secondId = "22222222-2222-4222-8222-222222222222";
  const records = {
    gmea_rentals: [id, secondId].map(id => ({ id, start_date: "2026-10-01", expected_return_date: "2026-10-02" })),
    gmea_rental_items: [{ id: "item", rental_id: id, rate: "100", quantity: "2" }],
    gmea_rental_payments: [{ id: "payment", rental_id: id, amount: "50", status: "posted" }],
  };
  const paymentFilters = [];
  const db = { from(table) {
    return { select() { return this; }, order() { return this; },
      in(field, values) { if (table === "gmea_rental_payments") paymentFilters.push([field, values]); return this; },
      range() { return this; },
      then(resolve) { return Promise.resolve({ data: records[table] || [], error: null }).then(resolve); },
    };
  } };
  const queries = load("features/gmea-rentals/server/gmeaRentalsQueries.ts", {
    "server-only": {}, "@/lib/auth": { APP_ROLES: { GMEA: "gmea", CEO: "ceo" }, requireRole: async () => ({}) },
    "./gmeaRentalsDatabase": { gmeaRentalsReader: async () => db },
  });
  const rows = await queries.getGmeaRentals();
  assert.deepEqual(paymentFilters, [["rental_id", [id, secondId]]]);
  assert.equal(rows[0].payments[0].amount, 50);
  assert.equal(rows[0].items[0].subtotal, 200);
  assert.deepEqual(rows[1].payments, []);
});
