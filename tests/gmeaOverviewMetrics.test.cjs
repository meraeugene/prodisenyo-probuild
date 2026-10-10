const assert = require("node:assert/strict");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const load = require("./helpers/loadGmeaModule.cjs");
const { buildGmeaOverviewRecords } = load("features/gmea-overview/utils/gmeaOverviewRecords.ts");
const { buildGmeaOverviewMetricTotals, selectGmeaOverviewMetricRecords, GMEA_OVERVIEW_METRICS } = load("features/gmea-overview/utils/gmeaOverviewMetrics.ts");
const { buildGmeaOverview } = load("features/gmea-overview/utils/gmeaOverviewSelectors.ts");
const { buildGmeaOverviewCollections } = load("features/gmea-overview/utils/gmeaOverviewCollections.ts");

const expense = (amount, extra = {}) => ({ amount, refunded_amount: 0, vat_mode: "off", vat_rate: 0, ...extra });
const project = (id, status, amount, receipts, expenses, tax_rate = 0) => ({
  id, status, title: "Project " + id, client: "Client " + id, contract_amount: amount, tax_rate,
  expenses, payment_terms: [{ amount, receipts }],
});
const rental = (id, status, amount) => ({ id, status, rental_number: "Rental " + id, client: "Client " + id, items: [{ subtotal: amount }] });
const payment = (id, amount, status = "posted") => ({ rental_id: id, amount, status });

function fixture() {
  return {
    projects: [
      project("a", "active", 1000, [{ amount: 500, status: "posted" }, { amount: 100, status: "voided" }], [expense(112, { vat_mode: "inclusive", vat_rate: 12, refunded_amount: 12 })], 12),
      project("b", "completed", 2000, [{ amount: 2300, status: "posted" }], [expense(2500)]),
    ],
    rentals: {
      rentals: [rental("a", "active", 1000), rental("b", "completed", 300), rental("c", "cancelled", 900)],
      payments: [payment("a", 200), payment("a", 100, "voided"), payment("b", 300), payment("c", 50)],
      expenses: [expense(300, { rental_id: "a" }), expense(100, { rental_id: "b" }), expense(20, { rental_id: "c" }), expense(40, { rental_id: null })],
      equipment: [], categories: [],
    },
  };
}

test("overview profit and loss retain losing completed records and shared rental costs", () => {
  const data = fixture(), before = structuredClone(data);
  const records = buildGmeaOverviewRecords(data), summary = buildGmeaOverview(data);
  assert.equal(summary.activeWork, 2);
  assert.equal(summary.divisions[0].count, 2);
  assert.equal(summary.totalRevenue, 3550);
  assert.equal(summary.totalExpenses, 3072);
  assert.equal(summary.totalProfit, 1118);
  assert.equal(summary.totalLoss, 640);
  assert.equal(summary.netProfit, 478);
  assert.equal(summary.totalProfit - summary.totalLoss, summary.netProfit);
  assert.deepEqual(selectGmeaOverviewMetricRecords(records, "loss").map(row => row.id), ["project:b", "rental:a", "rental:shared"]);
  assert.deepEqual({ totalCollected: summary.totalCollected, notCollected: summary.notCollected }, buildGmeaOverviewCollections(data));
  assert.deepEqual(data, before);
});

test("Sir Edward reimbursements do not reduce costs or hide a project's loss", () => {
  const data = {
    projects: [project("bulua", "completed", 175000, [], [expense(175195, { refunded_amount: 2183 })])],
    rentals: { rentals: [], expenses: [], payments: [], equipment: [], categories: [] },
  };
  const before = structuredClone(data);
  const summary = buildGmeaOverview(data);
  const record = buildGmeaOverviewRecords(data)[0];
  assert.equal(record.expenses, 175195);
  assert.equal(record.result, -195);
  assert.equal(summary.totalExpenses, 175195);
  assert.equal(summary.totalProfit, 0);
  assert.equal(summary.totalLoss, 195);
  assert.equal(summary.netProfit, -195);
  assert.deepEqual(data, before);
});

test("collection rate is weighted by receivable, includes contract tax, caps overpayments, and excludes cancelled charges", () => {
  const records = buildGmeaOverviewRecords(fixture());
  const totals = buildGmeaOverviewMetricTotals(records);
  assert.equal(totals.collected, 3350);
  assert.equal(totals.uncollected, 1420);
  assert.ok(Math.abs(totals["collection-rate"] - 3000 / 4420 * 100) < 1e-10);
  assert.equal(records.find(row => row.id === "project:b").creditedCollection, 2000);
  assert.equal(records.find(row => row.id === "rental:c").receivable, 0);
  const visible = selectGmeaOverviewMetricRecords(records, "collection-rate");
  assert.equal(visible.length, 4);
  assert.equal(buildGmeaOverviewMetricTotals(visible)["collection-rate"], totals["collection-rate"]);
  assert.equal(buildGmeaOverviewMetricTotals([])["collection-rate"], 0);
});

test("each drilldown reconciles to its dashboard metric, including filtered totals", () => {
  const records = buildGmeaOverviewRecords(fixture()), totals = buildGmeaOverviewMetricTotals(records);
  for (const metric of GMEA_OVERVIEW_METRICS) {
    const selected = selectGmeaOverviewMetricRecords(records, metric.id);
    assert.equal(buildGmeaOverviewMetricTotals(selected)[metric.id], totals[metric.id], metric.id);
  }
  const projects = selectGmeaOverviewMetricRecords(records, "profit", "  CLIENT A  ", "Projects Expenses");
  assert.deepEqual(projects.map(row => row.id), ["project:a"]);
  assert.equal(buildGmeaOverviewMetricTotals(projects).profit, 888);
  assert.deepEqual(selectGmeaOverviewMetricRecords(records, "ongoing").map(row => row.id).sort(), ["project:a", "rental:a"]);
});

test("metric detail pagination resets after filters and page size, and uses refreshed record counts", () => {
  let data = fixture();
  data.projects = Array.from({ length: 28 }, (_, i) => project(String(i).padStart(2, "0"), "active", 100, [], []));
  data.rentals = { rentals: [], expenses: [], payments: [], equipment: [], categories: [] };
  const states = [];
  let cursor = 0;
  const hooks = { ...React, useMemo: callback => callback(), useState(initial) {
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], value => { states[index] = value; }];
  } };
  const { useGmeaOverviewDetails } = load("features/gmea-overview/hooks/useGmeaOverviewDetails.ts", {
    react: hooks, swr: { default: () => ({ data }) }, "@/actions/gmeaOverview": {},
  });
  const render = () => { cursor = 0; return useGmeaOverviewDetails(data, "revenue", false); };
  let view = render();
  assert.equal(view.count, 28);
  assert.equal(view.pagination.pageRows.length, 10);
  view.pagination.onPageChange(3);
  view = render();
  assert.equal(view.pagination.pageRows.length, 8);
  view.setQuery("Project 27");
  view = render();
  assert.equal(view.pagination.page, 1);
  assert.equal(view.visible.length, 1);
  assert.equal(view.filteredTotals.revenue, 100);
  assert.equal(view.totals.revenue, 2800);
  view.reset();
  view = render();
  view.pagination.onPageSizeChange(25);
  view = render();
  assert.equal(view.pagination.pageRows.length, 25);
  view.pagination.onPageChange(2);
  view = render();
  assert.equal(view.pagination.pageRows.length, 3);
  view.setDivision("Rentals");
  view = render();
  assert.equal(view.pagination.page, 1);
  assert.equal(view.visible.length, 0);
  data = { ...data, projects: data.projects.slice(0, 1) };
  view = render();
  assert.equal(view.count, 1);
  assert.equal(view.totals.revenue, 100);
});

test("all eight summary cards are links; redundant clients and combined profit/loss cards are removed", () => {
  const Summary = load("features/gmea-overview/components/GmeaOverviewSummary.tsx", {
    "next/link": { default: ({ href, children, ...props }) => React.createElement("a", { href, ...props }, children) },
  }).default;
  const html = renderToStaticMarkup(React.createElement(Summary, { summary: buildGmeaOverview(fixture()) }));
  for (const metric of GMEA_OVERVIEW_METRICS) assert.ok(html.includes(`href="/gmea-overview/${metric.id}"`));
  assert.equal((html.match(/<a /g) || []).length, 8);
  assert.ok(!html.includes("Active clients"));
  assert.ok(!html.includes("Net profit / loss"));
});

test("legacy metric links require CEO/GMEA access and redirect to project details", async () => {
  let role;
  const Route = load("app/(dashboard)/gmea-overview/[metric]/page.tsx", {
    "next/navigation": { notFound() { throw new Error("NOT_FOUND"); }, redirect(path) { throw new Error("REDIRECT:" + path); } },
    "@/lib/auth": { APP_ROLES: { GMEA: "gmea", CEO: "ceo" }, async requireRole(allowed) {
      if (!allowed.includes(role)) throw new Error("DENIED");
      return { profile: { role } };
    } },
  }).default;
  for (role of ["ceo", "gmea"]) for (const metric of GMEA_OVERVIEW_METRICS) {
    await assert.rejects(Route({ params: Promise.resolve({ metric: metric.id }) }), error => error.message === `REDIRECT:/gmea-projects/summary/${metric.id}`);
  }
  for (role of ["engineer", "admin", "employee", "payroll_manager", "purchaser", null])
    await assert.rejects(Route({ params: Promise.resolve({ metric: "profit" }) }), /DENIED/);
  role = "ceo";
  await assert.rejects(Route({ params: Promise.resolve({ metric: "unknown" }) }), /NOT_FOUND/);
});
