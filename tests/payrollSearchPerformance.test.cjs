const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");

test("search and pagination reuse totals; payroll edits refresh them; exports build on demand", () => {
  const slots = [];
  let cursor = 0, calculations = 0, exports = 0;
  const employees = [{ name: "Adam", sites: [{}] }, { name: "Aidan", sites: [{}] }];
  const { usePayrollWorkspace } = load("features/payroll/hooks/usePayrollWorkspace.ts", {
    react: {
      useState: value => [value, () => {}],
      useEffect: () => {},
      useMemo(compute, dependencies) {
        const index = cursor++;
        const previous = slots[index];
        if (!previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
          slots[index] = { dependencies, value: compute() };
        }
        return slots[index].value;
      },
    },
    "@/features/payroll/utils/payrollSectionHelpers": {
      groupByEmployee: () => employees,
      matchesGroupedEmployeeFilters: (employee, filters) => employee.name.toLowerCase().includes(filters.nameFilter.toLowerCase()),
      buildPayrollPeriodLabel: () => "October 1–15",
      buildGroupedEmployeeMetrics: (_, payroll) => {
        calculations++;
        return { totalPay: 500 + payroll.payableHolidayDays * 500, actualTotalHours: 8 };
      },
    },
    "@/features/payroll/utils/payrollWorkspace": { countWeekdays: () => 5, employeeNeedsPayrollReview: () => false },
    "../utils/payrollPayslipRecords": { buildPayslipRecord: employee => { exports++; return { employee: employee.name }; } },
  });
  let payroll = {
    payrollRows: [], payrollSort: "name-asc", payrollNameFilter: "", payrollSiteFilter: "ALL", payrollDateFilter: "",
    payrollPage: 1, setPayrollPage() {}, employeeBranchRates: {}, payrollOverrides: {}, dailyRows: [], payableHolidayDays: 0, paidHolidays: [],
  };
  function render() { cursor = 0; return usePayrollWorkspace(payroll); }
  let workspace = render();
  assert.equal(workspace.totalPayroll, 1000);
  assert.equal(workspace.totalHours, 16);
  assert.equal(calculations, 2);
  assert.equal(exports, 0, "No export work while rendering");
  for (const query of ["A", "Ad", "Ada", "Adam"]) {
    payroll = { ...payroll, payrollNameFilter: query };
    workspace = render();
  }
  assert.equal(workspace.employeeCount, 1);
  assert.equal(calculations, 2, "Keystrokes do not recalculate employee pay");
  payroll = { ...payroll, payrollPage: 2 };
  workspace = render();
  assert.equal(calculations, 2, "Pagination does not recalculate employee pay");
  payroll = { ...payroll, payableHolidayDays: 1 };
  workspace = render();
  assert.equal(workspace.totalPayroll, 2000);
  assert.equal(calculations, 4);
  for (const field of ["employeeBranchRates", "payrollOverrides", "dailyRows"]) {
    payroll = { ...payroll, [field]: field === "dailyRows" ? [] : {} };
    render();
  }
  assert.equal(calculations, 10, "Rate, adjustment and attendance edits invalidate totals");
  assert.equal(exports, 0);
  assert.equal(workspace.buildPayslipRecords().length, 2, "Export includes all employees despite search");
  assert.equal(exports, 2);
});
