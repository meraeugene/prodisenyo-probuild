const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");
const { getDashboardNavigationGroups } = load("features/navigation/utils/dashboardNavigationItems.ts");
const { selectCeoPortfolioProjects } = load("features/ceo-dashboard/utils/ceoPortfolioSelectors.ts");
const { formatCeoCompactCurrency } = load("features/ceo-dashboard/utils/ceoDashboard.ts");

test("shared sidebar retains each role's landing route and role boundaries", () => {
  const destinations = { ceo: "/dashboard", admin: "/add-user", gmea: "/gmea-projects", payroll_manager: "/payroll-workspace", engineer: "/overview", purchaser: "/purchaser-dashboard", employee: "/home" };
  for (const [role, destination] of Object.entries(destinations)) {
    const hrefs = getDashboardNavigationGroups(role).flatMap((group) => group.items.map((item) => item.href));
    assert.ok(hrefs.includes(destination), `${role} must retain its primary workspace`);
    if (role !== "admin") assert.ok(!hrefs.includes("/add-user") && !hrefs.includes("/reset-data"));
    if (role !== "ceo") assert.ok(!hrefs.includes("/payroll-analytics") && !hrefs.includes("/overtime-approvals"));
    if (role === "employee") assert.ok(!hrefs.includes("/upload-attendance"));
  }
});

test("portfolio filters exclude planning projects from On Track and preserve source order", () => {
  const projects = [
    { id: "planning", status: "planning" }, { id: "active", status: "active" },
    { id: "risk", status: "on_hold" }, { id: "done", status: "completed" },
  ];
  assert.deepEqual(selectCeoPortfolioProjects(projects, "on-track").map((p) => p.id), ["active", "done"]);
  assert.deepEqual(selectCeoPortfolioProjects(projects, "at-risk").map((p) => p.id), ["risk"]);
  assert.deepEqual(selectCeoPortfolioProjects(projects, "all"), projects);
  assert.equal(projects.length, 4);
});

test("compact peso display retains material decimal precision and zero", () => {
  assert.equal(formatCeoCompactCurrency(18450000), "₱18.45M");
  assert.equal(formatCeoCompactCurrency(291200), "₱291.2K");
  assert.equal(formatCeoCompactCurrency(0), "₱0");
});
