import { useEffect, useMemo, useState } from "react";
import type { UsePayrollStateResult } from "@/features/payroll/hooks/usePayrollState";
import {
  buildGroupedEmployeeMetrics,
  buildPayrollPeriodLabel,
  groupByEmployee,
  matchesGroupedEmployeeFilters,
} from "@/features/payroll/utils/payrollSectionHelpers";
import { buildPayslipRecord } from "../utils/payrollPayslipRecords";
import {
  countWeekdays,
  employeeNeedsPayrollReview,
  type PayrollReviewFilter,
} from "@/features/payroll/utils/payrollWorkspace";
import type { PayslipExportRecord } from "@/lib/payslipExport";

import { TABLE_PAGE_SIZE as PAGE_SIZE } from "@/features/shared/pagination";

export function usePayrollWorkspace(payroll: UsePayrollStateResult) {
  const [activeView, setActiveView] = useState<PayrollReviewFilter | "logs">("all");
  const { employeeBranchRates, payrollOverrides, dailyRows, payableHolidayDays, paidHolidays } = payroll;
  const calculationInputs = useMemo(
    () => ({ employeeBranchRates, payrollOverrides, dailyRows, payableHolidayDays }),
    [employeeBranchRates, payrollOverrides, dailyRows, payableHolidayDays],
  );

  const allEmployees = useMemo(
    () => groupByEmployee(payroll.payrollRows, payroll.payrollSort),
    [payroll.payrollRows, payroll.payrollSort],
  );

  const filteredEmployees = useMemo(
    () =>
      allEmployees.filter((employee) =>
        matchesGroupedEmployeeFilters(employee, {
          siteFilter: payroll.payrollSiteFilter,
          roleFilter: "ALL",
          nameFilter: payroll.payrollNameFilter,
          dateFilter: payroll.payrollDateFilter,
        }),
      ),
    [
      allEmployees,
      payroll.payrollSiteFilter,
      payroll.payrollNameFilter,
      payroll.payrollDateFilter,
    ],
  );

  const needsReview = useMemo(
    () => allEmployees.filter(employeeNeedsPayrollReview).length,
    [allEmployees],
  );
  const ready = allEmployees.length - needsReview;

  const employeesForView = useMemo(() => {
    if (activeView === "review") return filteredEmployees.filter(employeeNeedsPayrollReview);
    if (activeView === "ready") return filteredEmployees.filter((employee) => !employeeNeedsPayrollReview(employee));
    return filteredEmployees;
  }, [activeView, filteredEmployees]);

  const totalPages = Math.max(1, Math.ceil(employeesForView.length / PAGE_SIZE));
  const page = Math.min(payroll.payrollPage, totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const visibleEmployees = employeesForView.slice(start, end);

  const { payrollPage, setPayrollPage } = payroll;
  useEffect(() => {
    if (payrollPage > totalPages) setPayrollPage(totalPages);
  }, [payrollPage, setPayrollPage, totalPages]);

  const periodLabel = useMemo(
    () => buildPayrollPeriodLabel(payroll.payrollRows),
    [payroll.payrollRows],
  );

  const totals = useMemo(
    () => allEmployees.reduce((sum, employee) => {
      const metrics = buildGroupedEmployeeMetrics(employee, calculationInputs);
      return { pay: sum.pay + metrics.totalPay, hours: sum.hours + metrics.actualTotalHours };
    }, { pay: 0, hours: 0 }),
    [allEmployees, calculationInputs],
  );

  function buildPayslipRecords() {
    return allEmployees
      .map(employee => buildPayslipRecord(employee, periodLabel, { ...calculationInputs, paidHolidays }))
      .filter((record): record is PayslipExportRecord => Boolean(record));
  }

  const workdayTarget = countWeekdays(
    payroll.payrollDateRange?.start,
    payroll.payrollDateRange?.end,
  );

  function changeView(view: PayrollReviewFilter | "logs") {
    setActiveView(view);
    payroll.setPayrollTab(view === "logs" ? "logs" : "payroll");
    payroll.setPayrollPage(1);
  }

  return {
    activeView,
    changeView,
    allEmployees,
    visibleEmployees,
    employeeCount: employeesForView.length,
    needsReview,
    ready,
    periodLabel,
    totalPayroll: totals.pay,
    totalHours: totals.hours,
    buildPayslipRecords,
    workdayTarget,
    page,
    totalPages,
    start,
    end,
  };
}
