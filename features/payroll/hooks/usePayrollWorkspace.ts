import { useEffect, useMemo, useState } from "react";
import type { UsePayrollStateResult } from "@/features/payroll/hooks/usePayrollState";
import {
  buildGroupedEmployeeMetrics,
  buildPayslipRecord,
  buildPayrollPeriodLabel,
  groupByEmployee,
  matchesGroupedEmployeeFilters,
} from "@/features/payroll/utils/payrollSectionHelpers";
import {
  countWeekdays,
  employeeNeedsPayrollReview,
  type PayrollReviewFilter,
} from "@/features/payroll/utils/payrollWorkspace";
import type { PayslipExportRecord } from "@/lib/payslipExport";

const PAGE_SIZE = 10;

export function usePayrollWorkspace(payroll: UsePayrollStateResult) {
  const [activeView, setActiveView] = useState<PayrollReviewFilter | "logs">("all");

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

  useEffect(() => {
    if (payroll.payrollPage > totalPages) payroll.setPayrollPage(totalPages);
  }, [payroll, totalPages]);

  const periodLabel = useMemo(
    () => buildPayrollPeriodLabel(payroll.payrollRows),
    [payroll.payrollRows],
  );

  const totalPayroll = useMemo(
    () => allEmployees.reduce((sum, employee) => sum + buildGroupedEmployeeMetrics(employee, payroll).totalPay, 0),
    [allEmployees, payroll],
  );

  const totalHours = useMemo(
    () => allEmployees.reduce((sum, employee) => sum + buildGroupedEmployeeMetrics(employee, payroll).actualTotalHours, 0),
    [allEmployees, payroll],
  );

  const payslipRecords = useMemo(
    () =>
      allEmployees
        .map((employee) => buildPayslipRecord(employee, periodLabel, payroll))
        .filter((record): record is PayslipExportRecord => Boolean(record)),
    [allEmployees, periodLabel, payroll],
  );

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
    totalPayroll,
    totalHours,
    payslipRecords,
    workdayTarget,
    page,
    totalPages,
    start,
    end,
  };
}
