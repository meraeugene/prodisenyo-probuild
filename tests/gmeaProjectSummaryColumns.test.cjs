const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const load = require("./helpers/loadGmeaModule.cjs");
const { projectSummaryColumns, projectSummaryColumnTotals, collectedDates, summaryPercentage, orderProjectSummary } = load("features/gmea-projects/utils/projectSummaryColumns.ts");
const { normalizeContractTerms, normalizeProjectDetails } = load("features/gmea-projects/utils/gmeaValidation.ts");
const { buildProjectSummaryWorkbookPlans } = load("features/gmea-projects/utils/projectSummaryWorkbookPlan.ts");
const source = { workbook: "source.xlsx", sheet: "PROJECT CONTRACT", sha256: "a".repeat(64), imported_at: "2026-10-09" };
const term = (amount, paid, percentage) => ({ id: randomUUID(), description: "Milestone", value_mode: "fixed", percentage: null, display_percentage: percentage, amount, notes: "", receipts: paid ? [{id:randomUUID(),amount:paid,received_date:"2026-07-30",status:"posted"}] : [] });
const project = (terms) => ({ id: randomUUID(), title: "BFAR", name: "Installation", color: "#FFFFFF", client: "", location: "CDO", duration: "21 Days", contract_amount: 500000, tax_rate: 0, status: "active", version: 1, expenses: [], partners: [], payment_terms: terms });

test("BFAR completion rows retain every milestone and separate paid from not yet", () => {
  const p = project([term(150000,150000,30),term(150000,150000,30),term(150000,0,30),term(50000,0,10)]);
  const row = projectSummaryColumns(p);
  assert.equal(row.completion.length,3);
  assert.equal(row.downPaid,150000);
  assert.equal(row.completionPaid,150000);
  assert.equal(row.completionOutstanding,200000);
  assert.equal(projectSummaryColumnTotals([p]).collected,300000);
});

test("collection dates exclude voided receipts and preserve unknown imported dates", () => {
  const t = term(100,25,20);
  t.receipts.push({amount:50,received_date:"2025-01-01",status:"voided"});
  t.imported_receipts = [{amount:10,received_date:null}];
  assert.deepEqual(collectedDates(t),[null,"2026-07-30"]);
  const row = projectSummaryColumns(project([t]));
  assert.equal(row.downPaid,35);
  assert.equal(row.downOutstanding,65);
});

test("fixed percentage labels do not recalculate Bulua or Royal source amounts", () => {
  const bulua = normalizeContractTerms({contract_amount:175000,tax_rate:0,payment_terms:[term(130000,0,75),term(45000,0,25)]});
  assert.deepEqual(bulua.payment_terms.map(t=>t.amount),[130000,45000]);
  assert.equal(summaryPercentage(bulua.payment_terms[0]),75);
  const royal = normalizeContractTerms({contract_amount:85000,tax_rate:0,payment_terms:[term(42500,0,50),term(42500,0,100)]});
  assert.equal(royal.payment_terms[1].amount,42500);
  assert.equal(royal.payment_terms[1].display_percentage,100);
  assert.throws(()=>normalizeContractTerms({contract_amount:85000,payment_terms:[term(85000,0,101)]}),/Percentage label/);
});

test("workbook summary changes only descriptive fields and labels, then repeats with no writes", () => {
  const p = project([term(150000,150000),term(150000,150000),term(150000,0),term(50000,0)]);
  const records = [{row:7,title:"BFAR",contract:500000,details:{title:"BFAR",name:"CCTV INSTALLATION & IT SUPPLIES",client:"Mrs. Nona S. Orquiza",location:"Macabalan",duration:"21 days"},terms:p.payment_terms.map((t,i)=>({amount:t.amount,cells:i ? `K${7+i-1}:M${7+i-1}` : "H7:I7",display_percentage:[30,30,30,10][i]}))}];
  const [plan] = buildProjectSummaryWorkbookPlans(records,[p],source);
  assert.deepEqual(plan.commands.map(c=>c.kind),["project_details","contract_terms"]);
  const after = {...p,...plan.details,payment_terms:plan.commands[1].value.payment_terms.map((t,i)=>({...t,receipts:p.payment_terms[i].receipts}))};
  assert.deepEqual(after.payment_terms.map(t=>t.amount),p.payment_terms.map(t=>t.amount));
  assert.equal(buildProjectSummaryWorkbookPlans(records,[after],source)[0].commands.length,0);
  // PostgreSQL jsonb can reorder provenance keys; this must not trigger a replay.
  after.payment_terms = after.payment_terms.map(t=>({...t,summary_source:Object.fromEntries(Object.entries(t.summary_source).reverse())}));
  assert.equal(buildProjectSummaryWorkbookPlans(records,[after],source)[0].commands.length,0);
  const emptyDuration = normalizeProjectDetails({...plan.details,duration:""});
  assert.equal(emptyDuration.duration,"");
  assert.deepEqual(orderProjectSummary([p,after]).map(item=>item.name),[after.name,p.name]);
});
