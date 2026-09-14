import type { AttendanceRecord, DailyLogRow, Step2Sort } from "@/types";
import {
  calculateDailyWorkMinutes,
  compareStep2Rows,
  earlierTime,
  laterTime,
  matchesSearchText,
  normalizeBiometricDailyTimes,
} from "@/lib/utils";

export interface AttendanceFilters {
  siteFilter: string;
  nameFilter: string;
  dateFilter: string;
  sort: Step2Sort;
}

export interface BranchSummary {
  siteName: string;
  employeeCount: number;
}

export function buildDailyRows(records: AttendanceRecord[]): DailyLogRow[] {
  const grouped = new Map<string, DailyLogRow>();

  const ordered = [...records].sort((a, b) =>
    a.date.localeCompare(b.date) || a.logTime.localeCompare(b.logTime) || a.site.localeCompare(b.site),
  );

  for (const record of ordered) {
    const identityKey = record.employeeId
      ? `employee:${record.employeeId}`
      : `raw:${(record.normalizedBiometricName ?? record.employee).trim().toLowerCase()}`;
    const key = `${record.date}|||${identityKey}`;
    const current = grouped.get(key) ?? {
      date: record.date,
      employee: record.employee,
      employeeId: record.employeeId ?? null,
      rawBiometricNames: [],
      matchStatus: record.employeeId ? "MATCHED" : record.matchStatus,
      matchSource: record.matchSource ?? null,
      time1In: "",
      time1Out: "",
      time2In: "",
      time2Out: "",
      otIn: "",
      otOut: "",
      regularHours: 0,
      overtimeHours: 0,
      totalHours: 0,
      hours: 0,
      site: record.site,
      sitePath: [],
      timeInSite: null,
      timeOutSite: null,
    };

    const rawName = record.rawBiometricName ?? record.employee;
    if (!current.rawBiometricNames?.includes(rawName)) current.rawBiometricNames = [...(current.rawBiometricNames ?? []), rawName];
    if (record.site && current.sitePath?.at(-1) !== record.site) current.sitePath = [...(current.sitePath ?? []), record.site];
    if (!current.employeeId && record.matchStatus === "NEEDS_REVIEW") {
      current.matchStatus = "NEEDS_REVIEW";
    }
    if (!current.site && record.site) current.site = record.site;

    if (record.source === "Time1" && record.type === "IN") {
      const next = earlierTime(current.time1In, record.logTime); if (next !== current.time1In) current.time1InSite = record.site; current.time1In = next;
    } else if (record.source === "Time1" && record.type === "OUT") {
      const next = laterTime(current.time1Out, record.logTime); if (next !== current.time1Out) current.time1OutSite = record.site; current.time1Out = next;
    } else if (record.source === "Time2" && record.type === "IN") {
      const next = earlierTime(current.time2In, record.logTime); if (next !== current.time2In) current.time2InSite = record.site; current.time2In = next;
    } else if (record.source === "Time2" && record.type === "OUT") {
      const next = laterTime(current.time2Out, record.logTime); if (next !== current.time2Out) current.time2OutSite = record.site; current.time2Out = next;
    } else if (record.source === "OT" && record.type === "IN") {
      const next = earlierTime(current.otIn, record.logTime); if (next !== current.otIn) current.otInSite = record.site; current.otIn = next;
    } else if (record.source === "OT" && record.type === "OUT") {
      const next = laterTime(current.otOut, record.logTime); if (next !== current.otOut) current.otOutSite = record.site; current.otOut = next;
    }

    const inTimes = [current.time1In, current.time2In, current.otIn].filter(Boolean).sort();
    const outTimes = [current.time1Out, current.time2Out, current.otOut].filter(Boolean).sort().reverse();
    if (record.type === "IN" && record.logTime === inTimes[0]) current.timeInSite = record.site;
    if (record.type === "OUT" && record.logTime === outTimes[0]) current.timeOutSite = record.site;

    grouped.set(key, current);
  }

  return Array.from(grouped.values()).map((row) => {
    const normalizedTimes = normalizeBiometricDailyTimes(row);
    const displayRow = { ...row, ...normalizedTimes };
    const dailyMinutes = calculateDailyWorkMinutes(displayRow);
    const totalHours =
      Math.round((dailyMinutes.totalMinutes / 60) * 100) / 100;

    return {
      ...displayRow,
      regularHours: Math.round((dailyMinutes.regularMinutes / 60) * 100) / 100,
      overtimeHours:
        Math.round((dailyMinutes.overtimeMinutes / 60) * 100) / 100,
      totalHours,
      hours: totalHours,
    };
  });
}

export function selectAvailableSites(records: AttendanceRecord[]): string[] {
  return Array.from(
    new Set(
      records
        .map((record) => record.site.trim())
        .filter((value) => value.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export function filterDetailedRecords(
  records: AttendanceRecord[],
  filters: AttendanceFilters,
): AttendanceRecord[] {
  const nameFilter = filters.nameFilter.trim().toLowerCase();
  const dateFilter = filters.dateFilter.trim();

  const filtered = records.filter((record) => {
    if (filters.siteFilter !== "ALL" && record.site !== filters.siteFilter) {
      return false;
    }
    if (dateFilter && record.date !== dateFilter) return false;
    if (nameFilter && !matchesSearchText(record.employee, nameFilter)) {
      return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    const byPrimary = compareStep2Rows(
      a.date,
      a.employee,
      b.date,
      b.employee,
      filters.sort,
    );
    if (byPrimary !== 0) return byPrimary;
    if (a.logTime !== b.logTime) return a.logTime.localeCompare(b.logTime);
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.source.localeCompare(b.source);
  });

  return filtered;
}

export function filterDailyRows(
  dailyRows: DailyLogRow[],
  filters: AttendanceFilters,
): DailyLogRow[] {
  const nameFilter = filters.nameFilter.trim().toLowerCase();
  const dateFilter = filters.dateFilter.trim();

  const filtered = dailyRows.filter((row) => {
    if (filters.siteFilter !== "ALL" && row.site !== filters.siteFilter) {
      return false;
    }
    if (dateFilter && row.date !== dateFilter) return false;
    if (nameFilter && !matchesSearchText(row.employee, nameFilter)) {
      return false;
    }
    return true;
  });

  filtered.sort((a, b) =>
    compareStep2Rows(a.date, a.employee, b.date, b.employee, filters.sort),
  );

  return filtered;
}

export function selectBranchSummaries(
  records: AttendanceRecord[],
): BranchSummary[] {
  const map = new Map<string, Set<string>>();

  for (const record of records) {
    const siteKey = record.site?.trim().toUpperCase().split(" ")[0];
    if (!siteKey) continue;
    if (!map.has(siteKey)) {
      map.set(siteKey, new Set<string>());
    }
    map.get(siteKey)?.add(record.employee.trim());
  }

  return Array.from(map.entries())
    .map(([siteName, employeesSet]) => ({
      siteName,
      employeeCount: employeesSet.size,
    }))
    .sort((a, b) => a.siteName.localeCompare(b.siteName));
}
