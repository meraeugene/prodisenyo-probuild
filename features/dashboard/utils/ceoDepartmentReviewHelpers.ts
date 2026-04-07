import { formatPayrollNumber } from "@/features/payroll/utils/payrollFormatters";
import type {
  HistoricalDashboardAttendanceLog,
  HistoricalDashboardPayrollItem,
} from "@/features/dashboard/hooks/useHistoricalDashboardData";

export const PESO_SIGN = "\u20B1";

export interface SiteReviewCard {
  siteName: string;
  shortSite: string;
  employees: number;
  payrollTotal: number;
}

export interface DailyAttendanceRow {
  date: string;
  site: string;
  t1In: string | null;
  t1Out: string | null;
  t2In: string | null;
  t2Out: string | null;
  otIn: string | null;
  otOut: string | null;
  hours: number;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function splitSiteNames(value: string): string[] {
  return value
    .split(",")
    .map((site) => site.trim())
    .filter((site) => site.length > 0);
}

export function extractBranchName(value: string): string {
  if (!value) return "";
  return value.trim().split(/\s+/)[0].toUpperCase();
}

export function formatLogDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatLogTime(value: string | null): string {
  if (!value) return "--";
  const date = new Date(`1970-01-01T${value}`);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function toMinutes(value: string | null): number {
  if (!value) return -1;
  const match = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return -1;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return -1;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return -1;
  return hours * 60 + minutes;
}

function pairHours(inTime: string | null, outTime: string | null): number {
  const inMinutes = toMinutes(inTime);
  const outMinutes = toMinutes(outTime);
  if (inMinutes < 0 || outMinutes < 0) return 0;
  let diff = outMinutes - inMinutes;
  if (diff < 0) diff += 24 * 60;
  if (diff <= 0 || diff > 16 * 60) return 0;
  return diff / 60;
}

export function buildDailyRows(
  logs: HistoricalDashboardAttendanceLog[],
): DailyAttendanceRow[] {
  const map = new Map<string, DailyAttendanceRow>();

  for (const log of logs) {
    const site = log.site_name?.trim() || "Unknown Site";
    const key = `${log.log_date}|||${site.toLowerCase()}`;
    const row = map.get(key) ?? {
      date: log.log_date,
      site,
      t1In: null,
      t1Out: null,
      t2In: null,
      t2Out: null,
      otIn: null,
      otOut: null,
      hours: 0,
    };
    const currentMinutes = toMinutes(log.log_time);

    if (log.log_source === "Time1") {
      if (log.log_type === "IN") {
        row.t1In =
          !row.t1In ||
          (currentMinutes >= 0 && currentMinutes < toMinutes(row.t1In))
            ? log.log_time
            : row.t1In;
      } else {
        row.t1Out =
          !row.t1Out ||
          (currentMinutes >= 0 && currentMinutes > toMinutes(row.t1Out))
            ? log.log_time
            : row.t1Out;
      }
    }

    if (log.log_source === "Time2") {
      if (log.log_type === "IN") {
        row.t2In =
          !row.t2In ||
          (currentMinutes >= 0 && currentMinutes < toMinutes(row.t2In))
            ? log.log_time
            : row.t2In;
      } else {
        row.t2Out =
          !row.t2Out ||
          (currentMinutes >= 0 && currentMinutes > toMinutes(row.t2Out))
            ? log.log_time
            : row.t2Out;
      }
    }

    if (log.log_source === "OT") {
      if (log.log_type === "IN") {
        row.otIn =
          !row.otIn ||
          (currentMinutes >= 0 && currentMinutes < toMinutes(row.otIn))
            ? log.log_time
            : row.otIn;
      } else {
        row.otOut =
          !row.otOut ||
          (currentMinutes >= 0 && currentMinutes > toMinutes(row.otOut))
            ? log.log_time
            : row.otOut;
      }
    }

    map.set(key, row);
  }

  return Array.from(map.values())
    .map((row) => ({
      ...row,
      hours: round2(
        pairHours(row.t1In, row.t1Out) +
          pairHours(row.t2In, row.t2Out) +
          pairHours(row.otIn, row.otOut),
      ),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildSiteCards(
  payrollItems: HistoricalDashboardPayrollItem[],
): SiteReviewCard[] {
  const employeeKeysBySite = new Map<string, Set<string>>();
  const payrollTotalBySite = new Map<string, number>();

  for (const item of payrollItems) {
    const employeeKey = normalizeKey(item.employee_name);

    splitSiteNames(item.site_name || "Unknown Site").forEach((siteName) => {
      const currentEmployees =
        employeeKeysBySite.get(siteName) ?? new Set<string>();
      currentEmployees.add(employeeKey);
      employeeKeysBySite.set(siteName, currentEmployees);
      payrollTotalBySite.set(
        siteName,
        round2((payrollTotalBySite.get(siteName) ?? 0) + (item.total_pay ?? 0)),
      );
    });
  }

  return Array.from(employeeKeysBySite.entries())
    .map(([siteName, employees]) => ({
      siteName,
      shortSite: extractBranchName(siteName),
      employees: employees.size,
      payrollTotal: payrollTotalBySite.get(siteName) ?? 0,
    }))
    .sort((a, b) => a.siteName.localeCompare(b.siteName));
}

export function formatPeso(value: number): string {
  return `${PESO_SIGN} ${formatPayrollNumber(value)}`;
}
