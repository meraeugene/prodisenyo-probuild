const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");
const { money, vatBreakdown, projectSummary } = load(
  "features/gmea-projects/utils/gmeaCalculations.ts",
);
const { normalizeMutation } = load(
  "features/gmea-projects/utils/gmeaValidation.ts",
);

const id = "11111111-1111-4111-8111-111111111111";

function project(contractAmount, expenses = []) {
  return {
    contract_amount: contractAmount,
    expenses,
    partners: [
      { id: "a", name: "Eng. Ruel Dumaguit", percentage: 50 },
      { id: "b", name: "Sir Edward", percentage: 50 },
    ],
  };
}

function expense(amount, vatMode = "off", vatRate = 0) {
  return { amount, vat_mode: vatMode, vat_rate: vatRate };
}

test("contract cost summary matches the workbook calculation", () => {
  const summary = projectSummary(project(85000, [expense(11568.2)]));
  assert.equal(summary.contract, 85000);
  assert.equal(summary.expenses, 11568.2);
  assert.equal(summary.profit, 73431.8);
  assert.equal(summary.partners[0].amount, 36715.9);
  assert.equal(summary.partners[1].amount, 36715.9);
});

test("losses remain visible and partner shares do not become negative", () => {
  const summary = projectSummary(project(175000, [expense(175195.5)]));
  assert.equal(summary.profit, -195.5);
  assert.equal(summary.distributable, 0);
  assert.ok(summary.partners.every((partner) => partner.amount === 0));
});

test("money rounds halfway cents consistently including losses", () => {
  assert.equal(money(1.005), 1.01);
  assert.equal(money(-1.005), -1.01);
  assert.equal(money(2.675), 2.68);
});

test("inclusive and exclusive VAT reconcile correctly", () => {
  assert.deepEqual(vatBreakdown(235, "inclusive", 12), {
    base: 209.82,
    vat: 25.18,
    gross: 235,
  });
  assert.deepEqual(vatBreakdown(100, "exclusive", 12), {
    base: 100,
    vat: 12,
    gross: 112,
  });
});

test("invalid amounts and VAT rates are rejected", () => {
  assert.throws(() => money(NaN));
  assert.throws(() => vatBreakdown(10, "exclusive", 0));
  assert.throws(() => vatBreakdown(10, "inclusive", -12));
});

test("project validation keeps only the workbook project fields", () => {
  const result = normalizeMutation({
    kind: "project",
    value: {
      name: " CCTV Installation ",
      client: " ",
      location: " Corrales Ave ",
      contract_amount: 78950,
      duration: " 7 Days ",
      description: "removed",
      start_date: "2026-01-01",
    },
  });
  assert.deepEqual(result.value, {
    name: "CCTV Installation",
    client: "",
    location: "Corrales Ave",
    contract_amount: 78950,
    duration: "7 Days",
  });
  assert.throws(() =>
    normalizeMutation({
      kind: "project",
      value: {
        name: "Missing contract",
        client: "",
        location: "CDO",
        contract_amount: 0,
        duration: "7 days",
      },
    }),
  );
});

test("expense identifiers stay strings and VAT is counted once", () => {
  const result = normalizeMutation({
    kind: "expense",
    value: {
      id,
      date: "2026-09-07",
      description: "Equipment",
      category: "Materials",
      supplier: "Vendor",
      invoice_number: "00059",
      invoice_name: "GMEA",
      amount: 112,
      refunded_amount: 25,
      vat_mode: "inclusive",
      vat_rate: 5,
      method: "Cash",
    },
  });
  assert.equal(result.value.invoice_number, "00059");
  assert.equal(result.value.vat_rate, 12);
  assert.equal(result.value.refunded_amount, 25);
  assert.equal(projectSummary(project(1000, [result.value])).expenses, 112);
});

test("contract collections keep the workbook row simple", () => {
  const result = normalizeMutation({
    kind: "collections",
    value: [
      {
        id,
        description: "Down payment of the contract 80%",
        amount: 200000,
        notes: "Paid · Cheque · 2335307 · Aug 07, 2026 · Deposited",
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        description: "Completion and final turn over 20%",
        amount: 50000,
        notes: "",
      },
    ],
  });
  assert.equal(result.value.length, 2);
  assert.equal(result.value[0].description, "Down payment of the contract 80%");
  assert.equal(result.value[1].description, "Completion and final turn over 20%");
});

test("partner validation requires unique rows totaling 100 percent", () => {
  assert.throws(() =>
    normalizeMutation({
      kind: "partners",
      value: [{ id, name: "Partner", percentage: 99 }],
    }),
  );
});

test("expense and project deletion commands are supported", () => {
  assert.deepEqual(
    normalizeMutation({ kind: "delete", entity: "expense", id }),
    { kind: "delete", entity: "expense", id },
  );
  assert.throws(() =>
    normalizeMutation({ kind: "delete", entity: "receipt", id }),
  );
  assert.throws(() =>
    normalizeMutation({ kind: "delete", entity: "collection", id }),
  );
  assert.deepEqual(normalizeMutation({ kind: "delete_project" }), {
    kind: "delete_project",
  });
});
