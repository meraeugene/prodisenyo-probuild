import type { PayrollRow } from "@/lib/payrollEngine";
import type { UsePayrollStateResult } from "../hooks/usePayrollState";
import type { LogHourOverrideValue } from "../types";
import type { PayslipExportRecord } from "@/lib/payslipExport";
import { buildEditingPayrollLogs } from "./payrollSelectors";
import { extractSiteName, formatLogTime, toWeekLabel } from "./payrollFormatters";
import { getLogOverrideKey } from "./payrollMappers";
import { buildGroupedEmployeeCompensation, buildGroupedEmployeeMetrics, pickRepresentativeRow, summarizeGroupedSites,
  type GroupedEmployeePayrollRow, type PayrollCalculationInputs } from "./payrollSectionHelpers";

export function buildPayslipRecord(
  employee: GroupedEmployeePayrollRow,
  periodLabel: string | null,
  payroll: PayrollCalculationInputs & Pick<UsePayrollStateResult, "paidHolidays">,
): PayslipExportRecord | null {
  const representativeRow = pickRepresentativeRow(employee.sites);
  if (!representativeRow) return null;
  const compensation = buildGroupedEmployeeCompensation(employee, payroll);
  const metrics = buildGroupedEmployeeMetrics(employee, payroll);

  const site = summarizeGroupedSites(employee.sites)
    .map((entry) => entry.site)
    .join(", ");
  const displayRow: PayrollRow = {
    ...representativeRow,
    worker: employee.name,
    role: employee.role,
    site,
    hoursWorked: metrics.paidRegularHours,
    overtimeHours: employee.sites.reduce((sum, row) => sum + row.overtimeHours, 0),
    regularPay: compensation.totalBasePay,
    totalPay: metrics.totalPay,
  };
  const mergedLogOverrides = Object.values(payroll.payrollOverrides).reduce<
    Record<string, LogHourOverrideValue>
  >((acc, override) => {
    if (!override.logHours) return acc;
    Object.assign(acc, override.logHours);
    return acc;
  }, {});
  const employeeLogs = buildEditingPayrollLogs(
    payroll.dailyRows,
    displayRow,
    representativeRow.date,
  );
  const holidayDateSet = new Set(
    payroll.paidHolidays.map((holiday) => holiday.date),
  );

  return {
    employee: employee.name,
    role: employee.role,
    site: site || "-",
    period: periodLabel ?? representativeRow.date ?? "-",
    daysWorked: metrics.daysWorked,
    totalHours: metrics.actualTotalHours,
    ratePerDay:
      compensation.totalPayableDays > 0
        ? compensation.totalBasePay / compensation.totalPayableDays
        : metrics.dailyRates[0] ?? 0,
    totalPay: metrics.totalPay,
    attendanceLogs: employeeLogs.map((log) => {
      const overrideHours = mergedLogOverrides[getLogOverrideKey(log)];
      const nextHours =
        typeof overrideHours === "number"
          ? overrideHours
          : overrideHours
            ? (overrideHours.regularHours ?? log.regularHours) +
              (overrideHours.overtimeHours ?? log.overtimeHours)
            : log.totalHours;

      return {
        dateLabel: toWeekLabel(log.date),
        site: extractSiteName(log.site) || "-",
        time1In: formatLogTime(log.time1In),
        time1Out: formatLogTime(log.time1Out),
        time2In: formatLogTime(log.time2In),
        time2Out: formatLogTime(log.time2Out),
        otIn: formatLogTime(log.otIn),
        otOut: formatLogTime(log.otOut),
        hours: nextHours,
        isPaidHoliday: holidayDateSet.has(log.date),
      };
    }),
  };
}

