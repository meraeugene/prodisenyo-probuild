const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");
const {
  contractCollectionSummary,
  money,
  paymentTermSummary,
  projectSummary,
  vatBreakdown,
} = load("features/gmea-projects/utils/gmeaCalculations.ts");
const { normalizeMutation } = load(
  "features/gmea-projects/utils/gmeaValidation.ts",
);

const id = "11111111-1111-4111-8111-111111111111";
const secondId = "22222222-2222-4222-8222-222222222222";

function project(contractAmount, expenses = []) {
  return {
    contract_amount: contractAmount,
    expenses,
    payment_terms: [],
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

test("project validation separates details from contract terms", () => {
  const result = normalizeMutation({
    kind: "create_project",
    value: {
      details: {
        name: " CCTV Installation ",
        client: " ",
        location: " Corrales Ave ",
        duration: " 7 Days ",
        description: "removed",
      },
      contract: {
        contract_amount: 78950,
        payment_terms: [
          {
            id,
            description: "Full payment",
            value_mode: "fixed",
            percentage: null,
            amount: 78950,
            notes: "",
          },
        ],
      },
    },
  });
  assert.deepEqual(result.value.details, {
    name: "CCTV Installation",
    client: "",
    location: "Corrales Ave",
    duration: "7 Days",
  });
  assert.equal(result.value.contract.contract_amount, 78950);
  assert.equal(result.value.contract.payment_terms.length, 1);
  assert.throws(() =>
    normalizeMutation({
      kind: "contract_terms",
      value: { contract_amount: 0, payment_terms: [] },
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

test("contract terms support mixed percentage and fixed values", () => {
  const result = normalizeMutation({
    kind: "contract_terms",
    value: {
      contract_amount: 175000,
      payment_terms: [
        {
          id,
          description: "Down payment of the contract",
          value_mode: "percentage",
          percentage: 75,
          amount: 0,
          notes: "Legacy detail retained",
        },
        {
          id: secondId,
          description: "Completion and turnover",
          value_mode: "fixed",
          percentage: null,
          amount: 43750,
          notes: "",
        },
      ],
    },
  });
  assert.equal(result.value.payment_terms.length, 2);
  assert.equal(result.value.payment_terms[0].amount, 131250);
  assert.equal(result.value.payment_terms[1].amount, 43750);
  assert.throws(() =>
    normalizeMutation({
      kind: "contract_terms",
      value: {
        contract_amount: 175000,
        payment_terms: [{ ...result.value.payment_terms[0], percentage: 50 }],
      },
    }),
  );
});

test("receipt totals produce unpaid, partial, paid, and outstanding states", () => {
  const term = {
    id,
    description: "Down payment",
    value_mode: "percentage",
    percentage: 75,
    amount: 131250,
    notes: "",
    receipts: [],
  };
  assert.equal(paymentTermSummary(term).status, "unpaid");
  term.receipts.push({ amount: 130000, status: "posted" });
  assert.deepEqual(paymentTermSummary(term), {
    received: 130000,
    balance: 1250,
    status: "partial",
  });
  term.receipts.push({ amount: 1250, status: "posted" });
  assert.equal(paymentTermSummary(term).status, "paid");
  term.receipts.push({ amount: 500, status: "voided" });
  const p = project(175000);
  p.payment_terms = [
    term,
    { ...term, id: secondId, amount: 43750, receipts: [] },
  ];
  assert.deepEqual(contractCollectionSummary(p), {
    scheduled: 175000,
    received: 131250,
    outstanding: 43750,
  });
});

test("receipts validate amount, identifiers, and date", () => {
  const result = normalizeMutation({
    kind: "record_receipt",
    value: {
      id,
      term_id: secondId,
      amount: 1250,
      received_date: "2026-09-07",
      method: " Bank transfer ",
      reference_number: " 00059 ",
      notes: "",
    },
  });
  assert.equal(result.value.amount, 1250);
  assert.equal(result.value.reference_number, "00059");
  assert.throws(() =>
    normalizeMutation({
      ...result,
      value: { ...result.value, received_date: "2999-01-01" },
    }),
  );
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
  assert.deepEqual(normalizeMutation({ kind: "delete_project" }), {
    kind: "delete_project",
  });
});
