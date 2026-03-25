import type { AttendanceRecordInput, PayrollRow } from "@/lib/payrollEngine";
import { generatePayroll, recalculatePayrollRow } from "@/lib/payrollEngine";
import {
  DEFAULT_OVERTIME_MULTIPLIER,
  HOURS_PER_DAY,
  type RoleCode,
} from "@/lib/payrollConfig";
import { compareStep2Rows, earliestNonEmptyTime, pairMinutes } from "@/lib/utils";
import type { DailyLogRow, Step2Sort } from "@/types";
import {
  parseNonNegativeOrFallback,
  toShortDateLabel,
} from "@/features/payroll/utils/payrollFormatters";
import { expandDateSummary, normalizePeriodLabel } from "@/features/payroll/utils/payrollDateHelpers";
import { parsePayrollIdentity, parseTimeToDecimal } from "@/features/payroll/utils/payrollMappers";
import type {
  PayrollAttendanceBreakdownItem,
  PayrollClockInConsistencyItem,
  PayrollEditDraft,
  PayrollEditSummary,
  PayrollEmployeeDailyHoursTrend,
  PayrollRowOverride,
} from "@/features/payroll/types";

export interface PayrollFilters {
  siteFilter: string;
  roleFilter: RoleCode | "ALL";
  nameFilter: string;
  dateFilter: string;
  sort: Step2Sort;
}

const EMPLOYEE_NAME_OVERRIDES: Record<string, string> = {
  pbryanm: "bryanmamerto",
};

export const FULL_WORKDAY_HOURS = 8;
export const FIXED_PAY_RATE_PER_DAY = 500;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface IsoDateSpan {
  start: string;
  end: string;
}

function normalizeEmployeeNameForGrouping(name: string): string {
  const normalized = name.trim().toLowerCase();
  const compact = normalized.replace(/[^a-z0-9]/g, "");
  return EMPLOYEE_NAME_OVERRIDES[compact] ?? compact;
}

export function computeDaysWorked(totalHours: number): number {
  if (!Number.isFinite(totalHours) || totalHours <= 0) return 0;
  return Math.floor(totalHours / FULL_WORKDAY_HOURS);
}

export function computeBasePay(totalHours: number): number {
  const daysWorked = computeDaysWorked(totalHours);
  return round2(daysWorked * FIXED_PAY_RATE_PER_DAY);
}

export function buildDateHoursMap(
  logs: Array<{ date: string; hours: number }>,
): Map<string, number> {
  const byDate = new Map<string, number>();

  for (const log of logs) {
    if (!log.date) continue;
    const current = byDate.get(log.date) ?? 0;
    const nextHours =
      Number.isFinite(log.hours) && log.hours >= 0 ? Number(log.hours) : 0;
    byDate.set(log.date, round2(current + nextHours));
  }

  return byDate;
}

export function buildDateSpanFromDates(
  dates: Iterable<string>,
): IsoDateSpan | null {
  let start: string | null = null;
  let end: string | null = null;

  for (const date of dates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (!start || date < start) start = date;
    if (!end || date > end) end = date;
  }

  if (!start || !end) return null;
  return { start, end };
}

export function buildWorkerDateSpanByKey(
  logs: AttendanceRecordInput[],
): Map<string, IsoDateSpan> {
  const spanByKey = new Map<string, IsoDateSpan>();

  for (const log of logs) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(log.date)) continue;
    const key = `${log.role}|||${log.name}`;
    const existing = spanByKey.get(key);

    if (!existing) {
      spanByKey.set(key, { start: log.date, end: log.date });
      continue;
    }

    if (log.date < existing.start) existing.start = log.date;
    if (log.date > existing.end) existing.end = log.date;
  }

  return spanByKey;
}

export function countHolidayBonusDays(
  dateHours: Map<string, number>,
  holidayDates: Iterable<string>,
  eligibleSpan?: IsoDateSpan | null,
): number {
  const uniqueHolidayDates = new Set(holidayDates);
  let count = 0;

  for (const holidayDate of uniqueHolidayDates) {
    if (
      eligibleSpan &&
      (holidayDate < eligibleSpan.start || holidayDate > eligibleSpan.end)
    ) {
      continue;
    }

    const loggedHours = dateHours.get(holidayDate) ?? 0;
    if (loggedHours < FULL_WORKDAY_HOURS) {
      count += 1;
    }
  }

  return count;
}

export function mapDailyRowsToAttendanceInputs(
  dailyRows: DailyLogRow[],
): AttendanceRecordInput[] {
  return dailyRows
    .map((row) => {
      const identity = parsePayrollIdentity(row.employee);

      return {
        name: identity.name,
        role: identity.role,
        site: row.site,
        date: row.date,
        hours: row.hours,
      };
    })
    .filter(
      (record) =>
        record.name.length > 0 &&
        Number.isFinite(record.hours) &&
        record.hours >= 0,
    );
}

export function buildPayrollBaseRows(
  payrollAttendanceInputs: AttendanceRecordInput[],
  roleRates: Record<RoleCode, number>,
  attendancePeriod: string,
): PayrollRow[] {
  const generated = generatePayroll(payrollAttendanceInputs, {
    roleRates,
    hoursPerDay: HOURS_PER_DAY,
    overtimeMultiplier: DEFAULT_OVERTIME_MULTIPLIER,
  });

  const normalizedPeriod = normalizePeriodLabel(attendancePeriod);
  if (!normalizedPeriod) return generated;

  return generated.map((row) => ({ ...row, date: normalizedPeriod }));
}

export function buildPayrollRows(
  payrollBaseRows: PayrollRow[],
  payrollOverrides: Record<string, PayrollRowOverride>,
  attendancePeriod: string,
): PayrollRow[] {
  const normalizedPeriod = normalizePeriodLabel(attendancePeriod);

  return payrollBaseRows.map((row) => {
    const override = payrollOverrides[row.id];

    if (!override) {
      return normalizedPeriod ? { ...row, date: normalizedPeriod } : row;
    }

    return recalculatePayrollRow(
      {
        ...row,
        date: normalizedPeriod ?? override.date,
        hoursWorked: override.hoursWorked,
        overtimeHours: override.overtimeHours,
        customRate: override.customRate,
      },
      DEFAULT_OVERTIME_MULTIPLIER,
    );
  });
}

export function filterPayrollRows(
  rows: PayrollRow[],
  filters: PayrollFilters,
): PayrollRow[] {
  const nameFilter = filters.nameFilter.trim().toLowerCase();
  const dateFilter = filters.dateFilter.trim();

  const filtered = rows.filter((row) => {
    if (
      filters.siteFilter !== "ALL" &&
      !row.site
        .split(",")
        .map((siteName) => siteName.trim())
        .includes(filters.siteFilter)
    ) {
      return false;
    }

    if (filters.roleFilter !== "ALL" && row.role !== filters.roleFilter) {
      return false;
    }

    if (dateFilter && !row.date.includes(dateFilter)) return false;

    if (nameFilter && !row.worker.toLowerCase().includes(nameFilter)) {
      return false;
    }

    return true;
  });

  filtered.sort((a, b) => {
    const dateA = a.date.split(" to ")[0] ?? a.date;
    const dateB = b.date.split(" to ")[0] ?? b.date;
    return compareStep2Rows(dateA, a.worker, dateB, b.worker, filters.sort);
  });

  return filtered;
}

export function filterPayrollLogs(
  logs: AttendanceRecordInput[],
  filters: PayrollFilters,
): AttendanceRecordInput[] {
  const nameFilter = filters.nameFilter.trim().toLowerCase();
  const dateFilter = filters.dateFilter.trim();

  const filtered = logs.filter((record) => {
    if (filters.siteFilter !== "ALL" && record.site !== filters.siteFilter) {
      return false;
    }

    if (filters.roleFilter !== "ALL" && record.role !== filters.roleFilter) {
      return false;
    }

    if (dateFilter && record.date !== dateFilter) return false;

    if (nameFilter && !record.name.toLowerCase().includes(nameFilter)) {
      return false;
    }

    return true;
  });

  filtered.sort((a, b) => compareStep2Rows(a.date, a.name, b.date, b.name, filters.sort));

  return filtered;
}

export function summarizePayrollTotals(rows: PayrollRow[]): {
  hours: number;
  pay: number;
} {
  return rows.reduce(
    (acc, row) => {
      acc.hours += row.hoursWorked;
      acc.pay += row.totalPay;
      return acc;
    },
    { hours: 0, pay: 0 },
  );
}

export function buildEditingPayrollLogs(
  dailyRows: DailyLogRow[],
  editingPayrollRow: PayrollRow | null,
  attendancePeriod: string,
): DailyLogRow[] {
  if (!editingPayrollRow) return [];

  const editingWorkerKey = normalizeEmployeeNameForGrouping(editingPayrollRow.worker);

  const matched = dailyRows.filter((row) => {
    const identity = parsePayrollIdentity(row.employee);
    return normalizeEmployeeNameForGrouping(identity.name) === editingWorkerKey;
  });

  matched.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    const bySite = a.site.localeCompare(b.site);
    if (bySite !== 0) return bySite;
    return a.employee.localeCompare(b.employee);
  });

  const dateRange = expandDateSummary(
    editingPayrollRow.date,
    matched.map((row) => row.date),
    attendancePeriod,
  );

  const allDates = Array.from(
    new Set([...dateRange, ...matched.map((row) => row.date)]),
  ).sort((a, b) => a.localeCompare(b));

  if (allDates.length === 0) return matched;

  const byDate = new Map<string, DailyLogRow[]>();
  for (const row of matched) {
    const existing = byDate.get(row.date);
    if (existing) {
      existing.push(row);
      continue;
    }

    byDate.set(row.date, [row]);
  }

  const employeeLabel = matched[0]?.employee ?? editingPayrollRow.worker;

  return allDates.flatMap((date) => {
    const logs = byDate.get(date);
    if (logs && logs.length > 0) return logs;

    return [
      {
        date,
        employee: employeeLabel,
        time1In: "",
        time1Out: "",
        time2In: "",
        time2Out: "",
        otIn: "",
        otOut: "",
        hours: 0,
        site: "",
      },
    ];
  });
}

export function buildEditingPayrollSummary(
  editingPayrollLogs: DailyLogRow[],
  editingPayrollRow: PayrollRow | null,
): PayrollEditSummary {
  if (!editingPayrollRow) {
    return {
      attendanceDays: 0,
      absenceDays: 0,
      regularHours: 0,
      otNormalHours: 0,
    };
  }

  const attendanceDays = editingPayrollLogs.filter((log) => log.hours > 0).length;
  const absenceDays = Math.max(editingPayrollLogs.length - attendanceDays, 0);
  const regularHours = attendanceDays * HOURS_PER_DAY;
  const otNormalHours = editingPayrollLogs.reduce((sum, log) => {
    if (!log.otIn || !log.otOut) return sum;
    return sum + pairMinutes(log.otIn, log.otOut) / 60;
  }, 0);

  return {
    attendanceDays,
    absenceDays,
    regularHours,
    otNormalHours,
  };
}

export function applyLogHourOverrides(
  editingPayrollLogs: DailyLogRow[],
  logHourOverrides: Record<string, number>,
  getLogKey: (log: DailyLogRow) => string,
): DailyLogRow[] {
  return editingPayrollLogs.map((log) => {
    const key = getLogKey(log);
    return {
      ...log,
      hours: logHourOverrides[key] ?? log.hours,
    };
  });
}

export function hasAnyLogHourOverrides(
  logHourOverrides: Record<string, number>,
): boolean {
  return Object.values(logHourOverrides).some(
    (value) => Number.isFinite(value) && value >= 0,
  );
}

export function calculateTotalEditedLogHours(logs: DailyLogRow[]): number {
  const hours = logs.reduce((sum, log) => sum + log.hours, 0);
  return round2(hours);
}

export function buildEmployeeDailyHoursTrend(
  logs: DailyLogRow[],
): PayrollEmployeeDailyHoursTrend[] {
  return logs.map((log) => ({
    date: toShortDateLabel(log.date),
    isoDate: log.date,
    hoursWorked: Math.round(log.hours * 100) / 100,
  }));
}

export function buildEmployeeAttendanceBreakdown(
  logs: DailyLogRow[],
): PayrollAttendanceBreakdownItem[] {
  const attendanceDays = logs.filter((log) => log.hours > 0).length;
  const absences = Math.max(logs.length - attendanceDays, 0);
  const leaveDays = 0;
  const businessTripDays = 0;

  return [
    { name: "Attendance", value: attendanceDays },
    { name: "Absences", value: absences },
    { name: "Leave", value: leaveDays },
    { name: "Business Trip", value: businessTripDays },
  ];
}

export function buildEmployeeClockInConsistency(
  logs: DailyLogRow[],
): PayrollClockInConsistencyItem[] {
  return logs.map((log) => {
    const firstIn = earliestNonEmptyTime(log.time1In, log.time2In);
    const parsed = firstIn ? parseTimeToDecimal(firstIn) : null;

    return {
      date: toShortDateLabel(log.date),
      isoDate: log.date,
      timeIn: parsed ?? 0,
      timeInLabel: firstIn || "Missed",
    };
  });
}

export function buildPayrollEditPreview(
  editingPayrollRow: PayrollRow | null,
  payrollEditDraft: PayrollEditDraft | null,
  hasLogHourOverrides: boolean,
  totalEditedLogHours: number,
): PayrollRow | null {
  if (!editingPayrollRow || !payrollEditDraft) return null;

  const nextHours = hasLogHourOverrides
    ? totalEditedLogHours
    : parseNonNegativeOrFallback(
        payrollEditDraft.hoursWorked,
        editingPayrollRow.hoursWorked,
      );

  const nextOvertime = parseNonNegativeOrFallback(
    payrollEditDraft.overtimeHours,
    editingPayrollRow.overtimeHours,
  );

  const nextCustomRate =
    payrollEditDraft.rate.trim() === ""
      ? null
      : parseNonNegativeOrFallback(
          payrollEditDraft.rate,
          editingPayrollRow.customRate ?? editingPayrollRow.defaultRate,
        );

  const fixedHourlyRate = round2(FIXED_PAY_RATE_PER_DAY / FULL_WORKDAY_HOURS);
  const regularPay = computeBasePay(nextHours);

  return {
    ...editingPayrollRow,
    date: payrollEditDraft.date.trim(),
    hoursWorked: round2(nextHours),
    overtimeHours: round2(nextOvertime),
    customRate: nextCustomRate,
    defaultRate: fixedHourlyRate,
    rate: fixedHourlyRate,
    regularPay,
    overtimePay: 0,
    totalPay: regularPay,
  };
}

