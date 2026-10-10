const assert = require("node:assert/strict"), test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");
const { buildRentalWorkbookExpensePlans: plans, rentalWorkbookEquipmentInputs: equipmentInputs } = load("features/gmea-rentals/utils/rentalWorkbookImport.ts");
const actions = load("actions/gmeaRentalWorkbookImport.ts");
const id = "11111111-1111-4111-8111-111111111111", secondId = "22222222-2222-4222-8222-222222222222";
const category = { id, name: "Diesel/Fuel", is_active: true, sort_order: 0 };
const source = overrides => ({ id, date: "2026-09-01", amount: 123.45, equipment: null, category: "Diesel/Fuel",
  rawDescription: "Diesel", payee: "", sourceLocator: "SEP 2026!A3:monthly-equipment", sourceFingerprint: "a".repeat(64),
  issues: [], sheet: "SEP 2026", address: "A3", ...overrides });

function database({ allowed = true, failId } = {}) {
  const calls = [];
  const db = {
    from(table) { assert.equal(table, "profiles"); return { select() { return this; }, eq() { return this; }, async single() { return { data: { role: allowed ? "gmea" : "ceo", is_active: true }, error: null }; } }; },
    async rpc(name, args) {
      calls.push({ name, args });
      return { data: args.p_command.value.id || secondId, error: args.p_command.value.id === failId ? { message: "Failed" } : null };
    },
  };
  return { db, calls };
}

test("workbook import preserves itemized dates, amounts, descriptions, and provenance without inventing payments or VAT", () => {
  const plan = plans([source({})], [category], [])[0];
  assert.equal(plan.command.kind, "create");
  assert.equal(plan.command.value.amount, 123.45);
  assert.equal(plan.command.value.date, "2026-09-01");
  assert.equal(plan.command.value.description, "Diesel");
  assert.equal(plan.command.value.rental_id, null);
  assert.equal(plan.command.value.vat_mode, "off");
  assert.equal(plan.command.value.vat_rate, 0);
  assert.equal(plan.command.value.refunded_amount, 0);
  assert.ok(plan.command.value.notes.includes("source: SEP 2026!A3:monthly-equipment"));
  assert.ok(plan.command.value.notes.includes("source-fingerprint:" + "a".repeat(64)));
});

test("held records, invalid dates, inactive categories and unresolved equipment fail before writes", () => {
  for (const record of [source({ issues: ["held"] }), source({ date: "2026-02-30" }), source({ equipment: "ANA" })]) assert.throws(() => plans([record], [category], []));
  assert.throws(() => plans([source({})], [{ ...category, is_active: false }], []));
  assert.throws(() => plans([source({}), source({})], [category], []), /Duplicate record/);
});

test("historical asset creation reuses recognized equipment and leaves availability unconfirmed", () => {
  const rows = [source({ equipment: "Yellow Dump Truck" }), source({ equipment: "Canter" })];
  const existing = [{ id, code: "YELLOW", name: "Yellow Dump" }];
  const inputs = equipmentInputs(rows, existing);
  assert.equal(inputs.length, 1);
  assert.equal(inputs[0].name, "Canter");
  assert.equal(inputs[0].code, "HIST-CANTER");
  assert.equal(inputs[0].status, "inactive");
  assert.equal(inputs[0].is_active, false);
  assert.equal(inputs[0].default_rate, null);
  assert.throws(() => equipmentInputs(rows, [...existing, { id: secondId, name: "Different asset", code: "HIST-CANTER" }]));
  assert.equal(plans([rows[0]], [category], existing)[0].command.value.equipment_id, id);
});

test("only the active GMEA actor can run privileged workbook import actions", async () => {
  const { db, calls } = database({ allowed: false });
  await assert.rejects(actions.applyRentalWorkbookExpensesAction(db, id, plans([source({})], [category], []), () => {}), /active GMEA/);
  await assert.rejects(actions.createRentalWorkbookEquipmentAction(db, id, [], () => {}), /active GMEA/);
  assert.equal(calls.length, 0);
});

test("all held and malformed plans are rejected before the first expense write", async () => {
  const { db, calls } = database(), valid = plans([source({})], [category], [])[0];
  const held = { ...valid, record: { ...valid.record, issues: ["date: missing"] } };
  await assert.rejects(actions.applyRentalWorkbookExpensesAction(db, id, [valid, held], () => {}), /Held expense/);
  assert.equal(calls.length, 0);
});

test("approved expenses use create-only RPCs and preserve a journal when one row fails", async () => {
  const { db, calls } = database({ failId: secondId }), journal = [];
  const selected = plans([source({}), source({ id: secondId, sourceLocator: "SEP 2026!A4:monthly-equipment" })], [category], []);
  await assert.rejects(actions.applyRentalWorkbookExpensesAction(db, id, selected, (id, source) => journal.push({ id, source })), /Failed/);
  assert.equal(calls.length, 2);
  assert.ok(calls.every(call => call.name === "mutate_gmea_rental_expense" && call.args.p_expense === null && call.args.p_version === null && call.args.p_command.kind === "create"));
  assert.deepEqual(journal, [{ id, source: selected[0].record.sourceLocator }]);
});
