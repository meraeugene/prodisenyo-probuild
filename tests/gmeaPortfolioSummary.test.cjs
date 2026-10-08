const assert = require("node:assert/strict");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const load = require("./helpers/loadGmeaModule.cjs");
const { buildGmeaPortfolioSummary } = load("features/gmea-projects/utils/gmeaPortfolioSummary.ts");

function project(status, amount, taxRate, expenses) {
  return { status, contract_amount: amount, tax_rate: taxRate,
    expenses: expenses.map(expense => ({ ...expense, date: "2026-10-01" })),
    partners: [], payment_terms: [], title: status, name: status, client: "Client",
    location: "Location", created_at: "2026-10-01T00:00:00Z" };
}

const projects = [
  project("active", 100, 12, [{ amount: 10, vat_mode: "exclusive", vat_rate: 12 }]),
  project("completed", 200, 5, [{ amount: 20, vat_mode: "inclusive", vat_rate: 12 }]),
];

test("portfolio totals include ongoing and completed contracts, tax, and expenses", () => {
  const before = structuredClone(projects);
  assert.deepEqual(buildGmeaPortfolioSummary(projects), {
    ongoingCount: 1, completedCount: 1, contractTotal: 322, expenseTotal: 31.2,
  });
  assert.deepEqual(projects, before);
  assert.equal(buildGmeaPortfolioSummary(projects.map(p => ({ ...p, status: "completed" }))).contractTotal, 322);
  assert.deepEqual(buildGmeaPortfolioSummary([]), {
    ongoingCount: 0, completedCount: 0, contractTotal: 0, expenseTotal: 0,
  });
});

test("CEO ongoing tab shows portfolio totals including completed projects", () => {
  const { useCeoGmeaPortfolio } = load("features/gmea-projects/hooks/useCeoGmeaPortfolio.ts", {
    swr: { default: () => ({ data: projects }) },
    "@/actions/gmeaProjects": { getGmeaProjectsDataAction() {} },
    "@/features/ceo-workspace/hooks/useCeoTablePagination": { useCeoTablePagination: () => ({}) },
  });
  let portfolio;
  function Probe() { portfolio = useCeoGmeaPortfolio(projects); return null; }
  renderToStaticMarkup(React.createElement(Probe));
  assert.equal(portfolio.tab, "Ongoing");
  assert.equal(portfolio.data.contract, 322);
  assert.equal(portfolio.data.expenses, 31.2);
  assert.equal(portfolio.data.outstanding, 322);
  assert.equal(portfolio.tabCounts.Ongoing, 1);
  assert.equal(portfolio.tabCounts.Completed, 1);
  assert.deepEqual(portfolio.visible, [projects[0]]);
});
