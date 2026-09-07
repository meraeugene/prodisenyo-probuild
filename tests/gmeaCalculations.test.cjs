const assert = require("node:assert/strict"),
  test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");
const {
  money,
  quotationTotals,
  vatBreakdown,
  projectSummary,
  milestoneSummary,
} = load("features/gmea-projects/utils/gmeaCalculations.ts");
const { normalizeMutation } = load(
  "features/gmea-projects/utils/gmeaValidation.ts",
);
const id = "11111111-1111-4111-8111-111111111111";
function quote(amount) {
  return {
    id,
    reference: "Q-1",
    date: "2026-09-07",
    notes: "",
    status: "accepted",
    items: [
      {
        description: "Installation",
        unit: "lot",
        quantity: 1,
        unit_price: amount,
      },
    ],
    discount: 0,
    vat_mode: "off",
    vat_rate: 0,
  };
}
function project(contract, expense, withholding = 0) {
  return {
    quotations: contract === null ? [] : [quote(contract)],
    expenses: expense
      ? [{ amount: expense, vat_mode: "off", vat_rate: 0 }]
      : [],
    receipts: [{ cash: 0, withholding, milestone_id: id }],
    milestones: [{ id, percentage: 100 }],
    partners: [
      { id: "a", percentage: 50 },
      { id: "b", percentage: 50 },
    ],
  };
}
test("Bulua preserves its loss and never distributes negative profit", () => {
  const s = projectSummary(project(175000, 175195.5));
  assert.equal(s.profit, -195.5);
  assert.equal(s.sharing, -195.5);
  assert.equal(s.distributable, 0);
  assert.equal(s.partners[0].amount, 0);
});
test("Royal Cable sharing subtracts withholding exactly once", () => {
  const s = projectSummary(project(85000, 11568.2, 1700));
  assert.equal(s.sharing, 71731.8);
  assert.equal(s.partners[0].amount, 35865.9);
});
test("money rounds halfway cents consistently including losses", () => {
  assert.equal(money(1.005), 1.01);
  assert.equal(money(-1.005), -1.01);
  assert.equal(money(2.675), 2.68);
});
test("quotation sums rounded lines and applies discount before exclusive VAT", () => {
  const q = quote(10);
  q.items = [
    { quantity: 3, unit_price: 0.335 },
    { quantity: 1, unit_price: 10 },
  ];
  q.discount = 1;
  q.vat_mode = "exclusive";
  q.vat_rate = 12;
  const r = quotationTotals(q);
  assert.equal(r.subtotal, 11.01);
  assert.equal(r.base, 10.01);
  assert.equal(r.vat, 1.2);
  assert.equal(r.gross, 11.21);
});
test("inclusive VAT reconciles to the entered gross amount", () => {
  const r = vatBreakdown(235, "inclusive", 12);
  assert.equal(r.base, 209.82);
  assert.equal(r.vat, 25.18);
  assert.equal(r.gross, 235);
});
test("invalid amounts rates discounts and quantities are rejected", () => {
  assert.throws(() => money(NaN));
  assert.throws(() => vatBreakdown(10, "exclusive", 0));
  assert.throws(() => vatBreakdown(10, "inclusive", -12));
  assert.throws(() => quotationTotals({ ...quote(10), discount: 11 }));
  assert.throws(() =>
    quotationTotals({ ...quote(10), items: [{ quantity: 0, unit_price: 10 }] }),
  );
});
test("unset contracts retain expenses without inventing profit or balances", () => {
  const s = projectSummary(project(null, 100));
  assert.equal(s.contract, null);
  assert.equal(s.profit, null);
  assert.equal(s.outstanding, null);
  assert.equal(s.expenses, 100);
});
test("partial payments withholding and overpayments", () => {
  const p = project(1000, 0, 100);
  p.receipts[0].cash = 300;
  assert.equal(milestoneSummary(p, id).status, "Partial");
  assert.equal(projectSummary(p).outstanding, 600);
  p.receipts[0].cash = 950;
  assert.equal(milestoneSummary(p, id).status, "Paid");
  assert.equal(projectSummary(p).overpayment, 50);
  assert.equal(projectSummary(p).outstanding, 0);
});
test("partner cent remainder is allocated once", () => {
  const s = projectSummary(project(0.01, 0));
  assert.equal(
    s.partners.reduce((n, p) => n + p.amount, 0),
    0.01,
  );
});
test("server ignores client quotation totals and status", () => {
  const r = normalizeMutation({
    kind: "quotation",
    value: { ...quote(100), total: 999999, status: "accepted" },
  });
  assert.equal(r.value.total, 100);
  assert.equal(r.value.status, "draft");
});
test("validation rejects impossible calendar dates and invalid percentage totals", () => {
  assert.throws(() =>
    normalizeMutation({
      kind: "quotation",
      value: { ...quote(100), date: "2026-02-30" },
    }),
  );
  assert.throws(() =>
    normalizeMutation({
      kind: "partners",
      value: [{ id, name: "Partner", percentage: 99 }],
    }),
  );
  assert.throws(() =>
    normalizeMutation({
      kind: "milestones",
      value: [{ id, label: "DP", percentage: 30 }],
    }),
  );
});
test("invoice identifiers remain strings and expenses count VAT once", () => {
  const e = {
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
  };
  const r = normalizeMutation({ kind: "expense", value: e });
  assert.equal(r.value.invoice_number, "00059");
  const p = project(1000, 0);
  p.expenses = [r.value];
  assert.equal(projectSummary(p).expenses, 112);
});

test("tiny profits with multiple partners never produce a negative share", () => {
  const p = project(0.02, 0);
  p.partners = [1, 2, 3, 4].map((id) => ({ id, percentage: 25 }));
  const s = projectSummary(p);
  assert.ok(s.partners.every((p) => p.amount >= 0));
  assert.equal(
    s.partners.reduce((sum, p) => sum + p.amount, 0),
    0.02,
  );
});

test("decimal half-cent rounding avoids binary drift", () => {
  assert.equal(money(10.075), 10.08);
  assert.equal(money(-10.075), -10.08);
  assert.equal(money(1e-7), 0);
});

test("milestone amounts reconcile to the contract including cent remainders",()=>{
 const p=project(123.45,0);p.milestones=[1,2,3,4].map(n=>({id:String(n),percentage:25}));
 const due=p.milestones.map(m=>milestoneSummary(p,m.id).due);
 assert.equal(money(due.reduce((a,b)=>a+b,0)),123.45);
});
