import { buildDailyRows } from "@/features/attendance/utils/attendanceSelectors";
import type { AttendanceRecord } from "@/types";

export type TrendRange = "daily" | "weekly" | "monthly" | "yearly";

export interface DailyPaidPoint {
  date: string;
  total: number;
}

export interface TrendPoint {
  key: string;
  label: string;
  total: number;
  timestamp: number;
}

export interface PayrollTrendRunInput {
  id: string;
  attendance_import_id?: string | null;
  period_label: string | null;
  period_start: string | null;
  period_end: string | null;
  submitted_at: string | null;
  created_at: string;
  net_total: number;
}

export interface PayrollTrendRunItemInput {
  payroll_run_id: string;
  employee_name?: string | null;
  site_name?: string | null;
  hours_worked?: number;
  total_pay: number;
}

export interface PayrollTrendAttendanceLogInput {
  import_id: string;
  employee_name: string;
  log_date: string;
  log_time: string;
  log_type: "IN" | "OUT";
  log_source: "Time1" | "Time2" | "OT";
  site_name: string;
}

export interface PayrollRunDailyTotalInput {
  payroll_run_id: string;
  payout_date: string;
  total_pay: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed;
}

function parseDateTime(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed;
}

function formatDateLabel(value: string): string {
  const parsed = parseIsoDate(value);
  if (!parsed) return value;
  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-PH", {
    month: "short",
    year: "numeric",
  });
}

function normalizeEmployeeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeSiteKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getWeekStart(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function buildDateRange(start: string | null, end: string | null): string[] {
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  if (!startDate || !endDate) return [];
  if (endDate.getTime() < startDate.getTime()) return [];

  const days: string[] = [];
  const cursor = new Date(startDate);
  const maxDays = 93;
  let count = 0;

  while (cursor.getTime() <= endDate.getTime() && count < maxDays) {
    days.push(toIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
    count += 1;
  }

  return days;
}

function resolveRunDate(run: PayrollTrendRunInput): Date {
  const fromPeriodEnd = parseIsoDate(run.period_end);
  if (fromPeriodEnd) return fromPeriodEnd;

  const fromSubmitted = parseDateTime(run.submitted_at);
  if (fromSubmitted) return fromSubmitted;

  const fromCreated = parseDateTime(run.created_at);
  if (fromCreated) return fromCreated;

  return new Date();
}

export function buildDailyPaidPointsFromPayrollRuns(
  runs: PayrollTrendRunInput[],
  runItems: PayrollTrendRunItemInput[],
  attendanceLogs: PayrollTrendAttendanceLogInput[] = [],
): DailyPaidPoint[] {
  const runsById = new Map(runs.map((run) => [run.id, run]));
  const runItemsByRunId = new Map<string, PayrollTrendRunItemInput[]>();
  const dailyTotals = new Map<string, number>();
  const dailyHoursByImport = new Map<
    string,
    {
      byEmployeeSiteDate: Map<string, Map<string, number>>;
      byEmployeeDate: Map<string, Map<string, number>>;
    }
  >();

  runItems.forEach((item) => {
    const bucket = runItemsByRunId.get(item.payroll_run_id) ?? [];
    bucket.push(item);
    runItemsByRunId.set(item.payroll_run_id, bucket);
  });

  const logsByImport = new Map<string, AttendanceRecord[]>();
  attendanceLogs.forEach((row) => {
    if (!row.import_id) return;
    const records = logsByImport.get(row.import_id) ?? [];
    records.push({
      date: row.log_date,
      employee: row.employee_name,
      logTime: row.log_time,
      type: row.log_type,
      source: row.log_source,
      site: row.site_name,
    });
    logsByImport.set(row.import_id, records);
  });

  logsByImport.forEach((records, importId) => {
    const dailyRows = buildDailyRows(records);
    const byEmployeeSiteDate = new Map<string, Map<string, number>>();
    const byEmployeeDate = new Map<string, Map<string, number>>();

    dailyRows.forEach((row) => {
      const employeeKey = normalizeEmployeeKey(row.employee);
      const siteKey = normalizeSiteKey(row.site || "");
      const employeeSiteKey = `${employeeKey}|||${siteKey}`;
      const siteDaily = byEmployeeSiteDate.get(employeeSiteKey) ?? new Map();
      const employeeDaily = byEmployeeDate.get(employeeKey) ?? new Map();

      siteDaily.set(row.date, (siteDaily.get(row.date) ?? 0) + (row.hours ?? 0));
      employeeDaily.set(
        row.date,
        (employeeDaily.get(row.date) ?? 0) + (row.hours ?? 0),
      );

      byEmployeeSiteDate.set(employeeSiteKey, siteDaily);
      byEmployeeDate.set(employeeKey, employeeDaily);
    });

    dailyHoursByImport.set(importId, {
      byEmployeeSiteDate,
      byEmployeeDate,
    });
  });

  runItemsByRunId.forEach((items, runId) => {
    const run = runsById.get(runId);
    if (!run) return;
    const importId = run.attendance_import_id ?? null;
    const importHours = importId ? dailyHoursByImport.get(importId) : null;

    let runTotalFromItems = 0;

    items.forEach((item) => {
      const itemTotal = round2(item.total_pay ?? 0);
      if (!Number.isFinite(itemTotal) || itemTotal <= 0) return;
      runTotalFromItems += itemTotal;

      const employeeKey = normalizeEmployeeKey(item.employee_name ?? "");
      const siteKey = normalizeSiteKey(item.site_name ?? "");
      const bySiteDaily =
        importHours?.byEmployeeSiteDate.get(`${employeeKey}|||${siteKey}`) ??
        null;
      const byEmployeeDaily = importHours?.byEmployeeDate.get(employeeKey) ?? null;
      const sourceDaily = bySiteDaily && bySiteDaily.size > 0 ? bySiteDaily : byEmployeeDaily;

      if (sourceDaily && sourceDaily.size > 0) {
        const totalHours = Array.from(sourceDaily.values()).reduce(
          (sum, value) => sum + value,
          0,
        );

        if (totalHours > 0) {
          sourceDaily.forEach((hours, date) => {
            const ratio = hours / totalHours;
            dailyTotals.set(date, (dailyTotals.get(date) ?? 0) + itemTotal * ratio);
          });
          return;
        }
      }

      const periodDays = buildDateRange(run.period_start, run.period_end);
      const allocationDays =
        periodDays.length > 0 ? periodDays : [toIsoDate(resolveRunDate(run))];
      const perDay = itemTotal / allocationDays.length;

      allocationDays.forEach((date) => {
        dailyTotals.set(date, (dailyTotals.get(date) ?? 0) + perDay);
      });
    });

    if (items.length === 0) {
      const runTotal = round2(run.net_total ?? 0);
      if (!Number.isFinite(runTotal) || runTotal <= 0) return;

      const periodDays = buildDateRange(run.period_start, run.period_end);
      const allocationDays =
        periodDays.length > 0 ? periodDays : [toIsoDate(resolveRunDate(run))];
      const perDay = runTotal / allocationDays.length;

      allocationDays.forEach((date) => {
        dailyTotals.set(date, (dailyTotals.get(date) ?? 0) + perDay);
      });
      return;
    }

    const residual = round2((run.net_total ?? 0) - runTotalFromItems);
    if (residual <= 0) return;

    const periodDays = buildDateRange(run.period_start, run.period_end);
    const allocationDays =
      periodDays.length > 0 ? periodDays : [toIsoDate(resolveRunDate(run))];
    const perDay = residual / allocationDays.length;
    allocationDays.forEach((date) => {
      dailyTotals.set(date, (dailyTotals.get(date) ?? 0) + perDay);
    });
  });

  runs.forEach((run) => {
    if (runItemsByRunId.has(run.id)) return;
    const runTotal = round2(run.net_total ?? 0);
    if (!Number.isFinite(runTotal) || runTotal <= 0) return;

    const periodDays = buildDateRange(run.period_start, run.period_end);
    const allocationDays =
      periodDays.length > 0 ? periodDays : [toIsoDate(resolveRunDate(run))];
    const perDay = runTotal / allocationDays.length;

    allocationDays.forEach((date) => {
      dailyTotals.set(date, (dailyTotals.get(date) ?? 0) + perDay);
    });
  });

  return Array.from(dailyTotals.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, total]) => ({
      date,
      total: round2(total),
    }));
}

export function buildDailyPaidPointsFromStoredTotals(
  dailyTotals: PayrollRunDailyTotalInput[],
): DailyPaidPoint[] {
  const totalsByDate = new Map<string, number>();

  dailyTotals.forEach((row) => {
    const date = row.payout_date?.trim();
    const total = Number.isFinite(row.total_pay) ? row.total_pay : 0;
    if (!date || total <= 0) return;
    totalsByDate.set(date, (totalsByDate.get(date) ?? 0) + total);
  });

  return Array.from(totalsByDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, total]) => ({
      date,
      total: round2(total),
    }));
}

export function buildWeeklyPointsFromPayrollReports(
  runs: PayrollTrendRunInput[],
): TrendPoint[] {
  const grouped = new Map<string, TrendPoint>();

  runs.forEach((run) => {
    const start = run.period_start;
    const end = run.period_end;
    const key = start && end ? `${start}__${end}` : run.period_label ?? run.id;
    const runDate = resolveRunDate(run);
    const timestamp = runDate.getTime();
    const label =
      start && end
        ? `${formatDateLabel(start)} - ${formatDateLabel(end)}`
        : run.period_label ?? formatDateLabel(toIsoDate(runDate));
    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, {
        key,
        label,
        total: run.net_total ?? 0,
        timestamp,
      });
      return;
    }

    current.total += run.net_total ?? 0;
    if (timestamp > current.timestamp) {
      current.timestamp = timestamp;
    }
  });

  return Array.from(grouped.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((point) => ({
      ...point,
      total: round2(point.total),
    }));
}

export function aggregateDailyPaidPoints(
  dailyPoints: DailyPaidPoint[],
  range: Exclude<TrendRange, "weekly">,
): TrendPoint[] {
  if (range === "daily") {
    return dailyPoints.map((point) => {
      const parsed = parseIsoDate(point.date) ?? new Date();
      return {
        key: point.date,
        label: formatDateLabel(point.date),
        total: round2(point.total),
        timestamp: parsed.getTime(),
      };
    });
  }

  const grouped = new Map<string, TrendPoint>();

  dailyPoints.forEach((point) => {
    const parsed = parseIsoDate(point.date);
    if (!parsed) return;

    let key = "";
    let label = "";
    let timestamp = 0;

    if (range === "monthly") {
      const monthStart = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
      label = formatMonthLabel(monthStart);
      timestamp = monthStart.getTime();
    } else {
      const yearStart = new Date(parsed.getFullYear(), 0, 1);
      key = String(parsed.getFullYear());
      label = key;
      timestamp = yearStart.getTime();
    }

    const current = grouped.get(key);
    if (!current) {
      grouped.set(key, {
        key,
        label,
        total: point.total,
        timestamp,
      });
      return;
    }

    current.total += point.total;
  });

  return Array.from(grouped.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((point) => ({
      ...point,
      total: round2(point.total),
    }));
}

export function aggregateDailyPointsToCalendarWeeks(
  dailyPoints: DailyPaidPoint[],
): TrendPoint[] {
  const grouped = new Map<string, TrendPoint>();

  dailyPoints.forEach((point) => {
    const parsed = parseIsoDate(point.date);
    if (!parsed) return;

    const weekStart = getWeekStart(parsed);
    const key = toIsoDate(weekStart);
    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, {
        key,
        label: formatDateLabel(key),
        total: point.total,
        timestamp: weekStart.getTime(),
      });
      return;
    }

    current.total += point.total;
  });

  return Array.from(grouped.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((point) => ({
      ...point,
      total: round2(point.total),
    }));
}
