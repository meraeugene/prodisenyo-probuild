import type { AttendanceRecord } from "@/types";

export interface BranchOvertimeRow {
  branch: string;
  hours: number;
}

export interface WorkforceByBranchRow {
  branch: string;
  employees: number;
}

export interface DailyLaborHoursRow {
  date: string;
  hours: number;
}

export interface TopOTEmployeeRow {
  name: string;
  hours: number;
}

function toMinutes(timeText: string): number {
  if (typeof timeText !== "string") return -1;

  const normalized = timeText.trim();
  if (!normalized) return -1;

  const match = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return -1;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return -1;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return -1;

  return hours * 60 + minutes;
}

function boundedPairMinutes(inTime: string, outTime: string): number {
  if (!inTime || !outTime) return 0;

  const inMinutes = toMinutes(inTime);
  const outMinutes = toMinutes(outTime);
  if (inMinutes < 0 || outMinutes < 0) return 0;

  let diff = outMinutes - inMinutes;
  if (diff < 0) diff += 24 * 60;
  if (diff <= 0 || diff > 16 * 60) return 0;
  return diff;
}

function extractBranch(site: string): string {
  return site.split(" ")[0] || "Unknown";
}

function buildOvertimeEntries(
  records: AttendanceRecord[],
): Array<{ employee: string; branch: string; hours: number }> {
  const grouped = new Map<
    string,
    {
      employee: string;
      branch: string;
      otIn: string;
      otOut: string;
    }
  >();

  records.forEach((record) => {
    const branch = extractBranch(record.site);
    const key = `${record.employee.trim().toLowerCase()}|||${record.date}|||${branch}`;
    const current = grouped.get(key) ?? {
      employee: record.employee,
      branch,
      otIn: "",
      otOut: "",
    };

    if (record.source === "OT" && record.type === "IN") current.otIn = record.logTime;
    if (record.source === "OT" && record.type === "OUT") current.otOut = record.logTime;

    grouped.set(key, current);
  });

  return Array.from(grouped.values()).map((entry) => ({
    employee: entry.employee,
    branch: entry.branch,
    hours: Number((boundedPairMinutes(entry.otIn, entry.otOut) / 60).toFixed(2)),
  }));
}

export function selectOvertimeByBranch(
  records: AttendanceRecord[],
): BranchOvertimeRow[] {
  const map = new Map<string, number>();

  buildOvertimeEntries(records).forEach((entry) => {
    map.set(entry.branch, (map.get(entry.branch) ?? 0) + entry.hours);
  });

  return Array.from(map.entries())
    .map(([branch, hours]) => ({
      branch,
      hours: Number(hours.toFixed(2)),
    }))
    .sort((a, b) => b.hours - a.hours);
}

export function selectWorkforceByBranch(
  records: AttendanceRecord[],
): WorkforceByBranchRow[] {
  const map = new Map<string, Set<string>>();

  records.forEach((record) => {
    const branch = extractBranch(record.site);
    if (!map.has(branch)) map.set(branch, new Set<string>());
    map.get(branch)?.add(record.employee);
  });

  return Array.from(map.entries())
    .map(([branch, set]) => ({
      branch,
      employees: set.size,
    }))
    .sort((a, b) => b.employees - a.employees);
}

export function selectDailyLaborHours(
  records: AttendanceRecord[],
): DailyLaborHoursRow[] {
  const map = new Map<string, number>();

  records.forEach((record) => {
    map.set(record.date, (map.get(record.date) ?? 0) + 1);
  });

  return Array.from(map.entries())
    .map(([date, logs]) => ({
      date,
      hours: logs / 2,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function selectTopOTEmployees(
  records: AttendanceRecord[],
): TopOTEmployeeRow[] {
  const map = new Map<string, number>();

  buildOvertimeEntries(records).forEach((entry) => {
    const key = entry.employee.trim().toLowerCase();
    map.set(key, (map.get(key) ?? 0) + entry.hours);
  });

  return Array.from(map.entries())
    .map(([key, hours]) => ({
      name: records.find((record) => record.employee.trim().toLowerCase() === key)?.employee ?? key,
      hours: Number(hours.toFixed(2)),
    }))
    .filter((employee) => employee.hours > 0)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);
}
