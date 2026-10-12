const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");

test("CEO payroll navigation opens records and keeps legacy analytics paths active", () => {
  const { getDashboardNavigationGroups } = load("features/navigation/utils/dashboardNavigationItems.ts");
  const payroll = getDashboardNavigationGroups("ceo").flatMap(group => group.items).find(item => item.label === "Payroll");
  assert.equal(payroll.href, "/payroll-approvals");
  assert.ok(payroll.activePaths.includes("/payroll-analytics"));
});

for (const role of ["ceo", "payroll_manager"]) {
  test(`${role} analytics access enforces CEO-only access`, async () => {
    const roles = [];
    const Page = load("app/(dashboard)/payroll-analytics/page.tsx", {
      "@/lib/auth": { requireRole: async allowed => {
        roles.push(allowed);
        if (role !== allowed) throw new Error("REDIRECT:/payroll-workspace");
        return { profile: { role } };
      } },
      "next/navigation": { redirect: url => { throw new Error(url); } },
      "@/features/analytics/components/PayrollAnalyticsPageClient": { default: () => null },
    }).default;
    const promise = Page({ searchParams: Promise.resolve({ runId: "run & special" }) });
    if (role === "ceo") await assert.rejects(promise, /payroll-approvals\?view=analytics&runId=run\+%26\+special/);
    else await assert.rejects(promise, /REDIRECT:\/payroll-workspace/);
    assert.deepEqual(roles, ["ceo"]);
  });
}

test("payroll managers can open drafts and returned runs but cannot view submitted or approved analytics", () => {
  const { payrollRunHref } = load("features/payroll-dashboard/utils/payrollWorkspacePresentation.ts");
  for (const status of ["draft", "rejected"]) {
    assert.equal(payrollRunHref({ id: "run-1", attendanceImportId: "import-1", status }), "/generate-payroll?importId=import-1&runId=run-1");
    assert.equal(payrollRunHref({ id: "run-1", attendanceImportId: null, status }), null);
  }
  for (const status of ["submitted", "approved"]) {
    assert.equal(payrollRunHref({ id: "run-1", attendanceImportId: "import-1", status }), null);
  }
});

test("CEO payroll entry defaults to records and honors analytics links after authorization", async () => {
  const checks = [];
  const Page = load("app/(dashboard)/payroll-approvals/page.tsx", {
    "@/lib/auth": { requireRole: async role => checks.push(role) },
    "@/actions/payroll": { getPayrollReportsDataAction: async () => ({ reports: [] }) },
    "@/features/payroll-reports/components/PayrollReportsPageClient": { default: () => null },
  }).default;
  assert.equal((await Page({ searchParams: Promise.resolve({}) })).props.initialView, "records");
  assert.equal((await Page({ searchParams: Promise.resolve({ view: "analytics" }) })).props.initialView, "analytics");
  assert.deepEqual(checks, ["ceo", "ceo"]);
});
