const assert = require("node:assert/strict");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const load = require("./helpers/loadGmeaModule.cjs");
const { PROJECT_METRICS, buildProjectMetricRecords, buildProjectMetricTotals, selectProjectMetricRecords } = load("features/gmea-projects/utils/projectMetrics.ts");

function projects() {
  return [
    { id: "a", title: "Solar", name: "Solar installation", client: "Client A", location: "Maramag", status: "active", contract_amount: 1000, tax_rate: 12, partners: [],
      expenses: [{ amount: 112, refunded_amount: 12, vat_mode: "inclusive", vat_rate: 12 }],
      payment_terms: [{ amount: 1120, receipts: [{ amount: 500, status: "posted" }, { amount: 100, status: "voided" }] }],
    },
    { id: "b", title: "CCTV", name: "CCTV installation", client: "Client B", location: "Cagayan", status: "completed", contract_amount: 2000, tax_rate: 0, partners: [],
      expenses: [{ amount: 2500, vat_mode: "off", vat_rate: 0 }],
      payment_terms: [{ amount: 2000, receipts: [{ amount: 2300, status: "posted" }] }],
    },
  ];
}

test("project cards include completed finances, separate losses, and retain tax/receipt rules", () => {
  const input = projects(), before = structuredClone(input);
  const totals = buildProjectMetricTotals(buildProjectMetricRecords(input));
  assert.deepEqual(totals, { ongoing: 1, revenue: 3000, expenses: 2612, profit: 888, loss: 500, collected: 2800, uncollected: 620, "collection-rate": 2500 / 3120 * 100 });
  assert.deepEqual(input, before);
  assert.deepEqual(buildProjectMetricTotals([]), Object.fromEntries(PROJECT_METRICS.map(metric => [metric.id, 0])));
});

test("every project drilldown reconciles to its card and filters client/location without rental data", () => {
  const records = buildProjectMetricRecords(projects()), totals = buildProjectMetricTotals(records);
  for (const metric of PROJECT_METRICS) assert.equal(buildProjectMetricTotals(selectProjectMetricRecords(records, metric.id))[metric.id], totals[metric.id]);
  assert.deepEqual(selectProjectMetricRecords(records, "profit", "  MARAMAG  ").map(row => row.project.id), ["a"]);
  assert.deepEqual(selectProjectMetricRecords(records, "loss", "CLIENT B").map(row => row.project.id), ["b"]);
});

test("project cards link to project detail routes and GMEA navigation separates Projects and Rentals", () => {
  const Summary = load("features/gmea-projects/components/GmeaProjectMetricSummary.tsx", {
    "next/link": { default: ({ href, children, ...props }) => React.createElement("a", { href, ...props }, children) },
  }).default;
  const html = renderToStaticMarkup(React.createElement(Summary, { projects: projects() }));
  assert.equal((html.match(/<a /g) || []).length, 8);
  for (const metric of PROJECT_METRICS) assert.ok(html.includes(`href="/gmea-projects/summary/${metric.id}"`));
  assert.ok(!html.includes("rentals"));
  const { getDashboardNavigationGroups } = load("features/navigation/utils/dashboardNavigationItems.ts");
  for (const role of ["ceo", "gmea"]) {
    const group = getDashboardNavigationGroups(role).find(group => group.label === "GMEA");
    assert.deepEqual(group.items.map(item => [item.label, item.href]), [["Projects", "/gmea-projects"], ["Rentals", "/gmea-rentals"]]);
  }
});

test("project metric pages authorize CEO/GMEA and reject unknown metrics before fetching", async () => {
  let role, reads = 0;
  const Route = load("app/(dashboard)/gmea-projects/summary/[metric]/page.tsx", {
    "next/navigation": { notFound() { throw new Error("NOT_FOUND"); } },
    "@/features/gmea-projects/components/GmeaProjectMetricPage": { default: () => null },
    "@/features/gmea-projects/server/gmeaQueries": {
      async requireGmeaAccess() { if (!["ceo", "gmea"].includes(role)) throw new Error("DENIED"); return { profile: { role } }; },
      async getGmeaProjects() { reads++; return projects(); },
    },
  }).default;
  for (role of ["gmea", "ceo"]) for (const metric of PROJECT_METRICS) {
    const page = await Route({ params: Promise.resolve({ metric: metric.id }) });
    assert.equal(page.props.metric, metric.id);
    assert.equal(page.props.canEdit, role === "gmea");
    assert.equal(page.props.projects.length, 2);
  }
  const before = reads;
  for (role of ["admin", "engineer", "employee", "payroll_manager", "purchaser", null]) await assert.rejects(Route({ params: Promise.resolve({ metric: "profit" }) }), /DENIED/);
  role = "gmea";
  await assert.rejects(Route({ params: Promise.resolve({ metric: "invalid" }) }), /NOT_FOUND/);
  assert.equal(reads, before);
});

test("the removed dashboard redirects to Projects after checking access", async () => {
  let allowed = true;
  const Route = load("app/(dashboard)/gmea-overview/page.tsx", {
    "next/navigation": { redirect(path) { throw new Error("REDIRECT:" + path); } },
    "@/lib/auth": { APP_ROLES: { CEO: "ceo", GMEA: "gmea" }, requireRole: async roles => { assert.deepEqual(roles, ["gmea", "ceo"]); if (!allowed) throw new Error("DENIED"); } },
  }).default;
  await assert.rejects(Route(), /REDIRECT:\/gmea-projects/);
  allowed = false;
  await assert.rejects(Route(), /DENIED/);
});
