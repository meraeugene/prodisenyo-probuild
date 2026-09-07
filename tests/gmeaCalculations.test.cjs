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

function project(contractAmount, expenses = [], withholdingTaxRate = 0) {
  return {
    contract_amount: contractAmount,
    withholding_tax_rate: withholdingTaxRate,
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
  const summary = projectSummary(project(85000, [expense(11568.2)], 2));
  assert.equal(summary.contract, 85000);
  assert.equal(summary.withholding, 1700);
  assert.equal(summary.netContract, 83300);
  assert.equal(summary.expenses, 11568.2);
  assert.equal(summary.profit, 71731.8);
  assert.equal(summary.partners[0].amount, 35865.9);
  assert.equal(summary.partners[1].amount, 35865.9);
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
      withholding_tax_rate: 2,
      duration: " 7 Days ",
      status: "planning",
      description: "removed",
      start_date: "2026-01-01",
    },
  });
  assert.deepEqual(result.value, {
    name: "CCTV Installation",
    client: "",
    location: "Corrales Ave",
    contract_amount: 78950,
    withholding_tax_rate: 2,
    duration: "7 Days",
    status: "planning",
  });
  assert.throws(() =>
    normalizeMutation({
      kind: "project",
      value: {
        name: "Missing contract",
        client: "",
        location: "CDO",
        contract_amount: 0,
        withholding_tax_rate: 0,
        duration: "7 days",
        status: "planning",
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
      vat_mode: "inclusive",
      vat_rate: 12,
      method: "Cash",
      notes: "",
    },
  });
  assert.equal(result.value.invoice_number, "00059");
  assert.equal(projectSummary(project(1000, [result.value])).expenses, 112);
});

test("partner validation requires unique rows totaling 100 percent", () => {
  assert.throws(() =>
    normalizeMutation({
      kind: "partners",
      value: [{ id, name: "Partner", percentage: 99 }],
    }),
  );
});

test("expense deletion is the only supported financial deletion", () => {
  assert.deepEqual(
    normalizeMutation({ kind: "delete", entity: "expense", id }),
    { kind: "delete", entity: "expense", id },
  );
  assert.throws(() =>
    normalizeMutation({ kind: "delete", entity: "receipt", id }),
  );
});
