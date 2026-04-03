"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Users, X } from "lucide-react";
import { formatPayrollNumber } from "@/features/payroll/utils/payrollFormatters";
import { cn } from "@/lib/utils";
import type {
  HistoricalDashboardAttendanceLog,
  HistoricalDashboardDailyTotal,
  HistoricalDashboardPayrollItem,
} from "@/features/dashboard/hooks/useHistoricalDashboardData";

const PESO_SIGN = "\u20B1";

interface SiteReviewCard {
  siteName: string;
  shortSite: string;
  employees: number;
  payrollTotal: number;
}

interface DailyAttendanceRow {
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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function splitSiteNames(value: string): string[] {
  return value
    .split(",")
    .map((site) => site.trim())
    .filter((site) => site.length > 0);
}

function extractBranchName(value: string): string {
  if (!value) return "";
  return value.trim().split(/\s+/)[0].toUpperCase();
}

function formatLogDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatLogTime(value: string | null): string {
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

function buildDailyRows(
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

function buildSiteCards(
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

function ModalShell({
  title,
  eyebrow,
  subtitle,
  onClose,
  children,
  size = "max-w-6xl",
}: {
  title: string;
  eyebrow: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: string;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          "flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_28px_80px_rgba(15,23,42,0.24)]",
          size,
        )}
      >
        <div className="border-b border-apple-mist bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                {eyebrow}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                {title}
              </h2>
              <p className="mt-2 text-sm text-white/80">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close payroll review modal"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-emerald-400/25 bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-3 py-2 text-white">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function MetricRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <tr>
      <td className="px-4 py-2 text-apple-steel">{label}</td>
      <td
        className={cn(
          "px-4 py-2 text-right font-semibold text-apple-charcoal",
          valueClass,
        )}
      >
        {value}
      </td>
    </tr>
  );
}

function EmployeeLogsModal({
  attendancePeriod,
  item,
  attendanceLogs,
  dailyTotals,
  onClose,
}: {
  attendancePeriod: string;
  item: HistoricalDashboardPayrollItem;
  attendanceLogs: HistoricalDashboardAttendanceLog[];
  dailyTotals: HistoricalDashboardDailyTotal[];
  onClose: () => void;
}) {
  const scopedLogs = useMemo(
    () =>
      attendanceLogs.filter(
        (log) =>
          normalizeKey(log.employee_name) === normalizeKey(item.employee_name),
      ),
    [attendanceLogs, item.employee_name],
  );

  const dailyRows = useMemo(() => buildDailyRows(scopedLogs), [scopedLogs]);

  const scopedDailyTotals = useMemo(
    () =>
      dailyTotals
        .filter(
          (row) =>
            row.payroll_run_item_id === item.id ||
            (normalizeKey(row.employee_name) === normalizeKey(item.employee_name) &&
              normalizeKey(row.role_code ?? "") ===
                normalizeKey(item.role_code ?? "")),
        )
        .sort((a, b) => a.payout_date.localeCompare(b.payout_date)),
    [dailyTotals, item.id, item.employee_name, item.role_code],
  );

  const attendanceDays = new Set(scopedLogs.map((log) => log.log_date)).size;
  const inLogs = scopedLogs.filter((log) => log.log_type === "IN").length;
  const outLogs = scopedLogs.filter((log) => log.log_type === "OUT").length;
  const otLogs = scopedLogs.filter((log) => log.log_source === "OT").length;

  return (
    <ModalShell
      title={item.employee_name}
      eyebrow="Read-only Payroll Review"
      subtitle={`${item.role_code} | ${item.site_name} | ${attendancePeriod}`}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStat
            label="Days Worked"
            value={item.days_worked.toLocaleString("en-PH")}
          />
          <SummaryStat
            label="Hours Worked"
            value={item.hours_worked.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          />
          <SummaryStat
            label="Overtime Hours"
            value={item.overtime_hours.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          />
          <SummaryStat
            label="Total Paid"
            value={`${PESO_SIGN} ${formatPayrollNumber(item.total_pay)}`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-apple-mist bg-white">
            <div className="border-b border-apple-mist px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                Payroll Analytics
              </p>
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-apple-mist">
                <MetricRow
                  label="Regular Pay"
                  value={`${PESO_SIGN} ${formatPayrollNumber(item.regular_pay)}`}
                />
                <MetricRow
                  label="Overtime Pay"
                  value={`${PESO_SIGN} ${formatPayrollNumber(item.overtime_pay)}`}
                />
                <MetricRow
                  label="Holiday Pay"
                  value={`${PESO_SIGN} ${formatPayrollNumber(item.holiday_pay)}`}
                />
                <MetricRow
                  label="Deductions"
                  value={`${PESO_SIGN} ${formatPayrollNumber(
                    item.deductions_total,
                  )}`}
                  valueClass="text-rose-700"
                />
                <MetricRow
                  label="Net Paid"
                  value={`${PESO_SIGN} ${formatPayrollNumber(item.total_pay)}`}
                  valueClass="font-bold"
                />
              </tbody>
            </table>
          </div>

          <div className="overflow-hidden rounded-xl border border-apple-mist bg-white">
            <div className="border-b border-apple-mist px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                Attendance Analytics
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              <SummaryStat
                label="Logged Days"
                value={attendanceDays.toLocaleString("en-PH")}
              />
              <SummaryStat
                label="IN Logs"
                value={inLogs.toLocaleString("en-PH")}
              />
              <SummaryStat
                label="OUT Logs"
                value={outLogs.toLocaleString("en-PH")}
              />
              <SummaryStat
                label="OT Logs"
                value={otLogs.toLocaleString("en-PH")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-apple-mist bg-white">
            <div className="border-b border-apple-mist px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                Attendance Logs
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[rgb(var(--apple-snow))]">
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">
                      Site
                    </th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">
                      Time1
                    </th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">
                      Time2
                    </th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">
                      OT
                    </th>
                    <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">
                      Hours
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apple-mist">
                  {dailyRows.length > 0 ? (
                    dailyRows.map((row) => (
                      <tr key={`${row.date}|||${row.site}`}>
                        <td className="px-3 py-2 text-apple-smoke">
                          {formatLogDate(row.date)}
                        </td>
                        <td className="px-3 py-2 text-apple-smoke">{row.site}</td>
                        <td className="px-3 py-2 text-apple-smoke">
                          {formatLogTime(row.t1In)} - {formatLogTime(row.t1Out)}
                        </td>
                        <td className="px-3 py-2 text-apple-smoke">
                          {formatLogTime(row.t2In)} - {formatLogTime(row.t2Out)}
                        </td>
                        <td className="px-3 py-2 text-apple-smoke">
                          {formatLogTime(row.otIn)} - {formatLogTime(row.otOut)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-apple-charcoal">
                          {row.hours.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-4 text-center text-apple-steel"
                      >
                        No attendance logs found for this employee.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-apple-mist bg-white">
            <div className="border-b border-apple-mist px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                Daily Paid Totals
              </p>
            </div>
            <div className="max-h-[300px] overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[rgb(var(--apple-snow))]">
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">
                      Date
                    </th>
                    <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">
                      Hours
                    </th>
                    <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">
                      Paid
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apple-mist">
                  {scopedDailyTotals.length > 0 ? (
                    scopedDailyTotals.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-2 text-apple-smoke">
                          {formatLogDate(row.payout_date)}
                        </td>
                        <td className="px-3 py-2 text-right text-apple-smoke">
                          {(row.hours_worked ?? 0).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-apple-charcoal">
                          {PESO_SIGN} {formatPayrollNumber(row.total_pay ?? 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-4 text-center text-apple-steel"
                      >
                        No daily paid totals found for this employee.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function SiteLogsModal({
  siteName,
  attendancePeriod,
  logs,
  onClose,
}: {
  siteName: string;
  attendancePeriod: string;
  logs: HistoricalDashboardAttendanceLog[];
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const filteredLogs = useMemo(() => {
    const term = normalizeKey(search);
    return logs.filter((log) => {
      if (!term) return true;
      return normalizeKey(log.employee_name).includes(term);
    });
  }, [logs, search]);

  const employeeCount = new Set(
    filteredLogs.map((log) => normalizeKey(log.employee_name)),
  ).size;

  return (
    <ModalShell
      title={siteName}
      eyebrow="All Site Employee Logs"
      subtitle={`${attendancePeriod} | ${employeeCount.toLocaleString(
        "en-PH",
      )} employees with logs`}
      onClose={onClose}
      size="max-w-7xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryStat
            label="Log Rows"
            value={filteredLogs.length.toLocaleString("en-PH")}
          />
          <SummaryStat
            label="Employees"
            value={employeeCount.toLocaleString("en-PH")}
          />
          <SummaryStat label="Site" value={siteName} />
        </div>

        <div className="rounded-xl border border-apple-mist bg-white">
          <div className="border-b border-apple-mist px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                Read-only Site Logs
              </p>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee..."
                className="h-9 min-w-[220px] rounded-lg border border-apple-mist bg-white px-3 text-xs text-apple-charcoal outline-none transition focus:border-[#1f6a37]"
              />
            </div>
          </div>

          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[rgb(var(--apple-snow))]">
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">
                    Employee
                  </th>
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">
                    Time
                  </th>
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">
                    Type
                  </th>
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-mist">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-3 py-2 font-medium text-apple-charcoal">
                        {log.employee_name}
                      </td>
                      <td className="px-3 py-2 text-apple-smoke">
                        {formatLogDate(log.log_date)}
                      </td>
                      <td className="px-3 py-2 text-apple-smoke">
                        {formatLogTime(log.log_time)}
                      </td>
                      <td className="px-3 py-2 text-apple-smoke">
                        {log.log_type}
                      </td>
                      <td className="px-3 py-2 text-apple-smoke">
                        {log.log_source}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-apple-steel"
                    >
                      No site logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function SiteReviewModal({
  siteName,
  attendancePeriod,
  payrollItems,
  attendanceLogs,
  dailyTotals,
  onClose,
}: {
  siteName: string;
  attendancePeriod: string;
  payrollItems: HistoricalDashboardPayrollItem[];
  attendanceLogs: HistoricalDashboardAttendanceLog[];
  dailyTotals: HistoricalDashboardDailyTotal[];
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [showAllSiteLogs, setShowAllSiteLogs] = useState(false);

  const siteItems = useMemo(
    () =>
      payrollItems
        .filter((item) =>
          splitSiteNames(item.site_name).some(
            (value) => normalizeKey(value) === normalizeKey(siteName),
          ),
        )
        .sort((a, b) => a.employee_name.localeCompare(b.employee_name)),
    [payrollItems, siteName],
  );

  const filteredItems = useMemo(() => {
    const term = normalizeKey(search);
    return siteItems.filter((item) => {
      if (!term) return true;
      return normalizeKey(item.employee_name).includes(term);
    });
  }, [search, siteItems]);

  const siteLogs = useMemo(
    () =>
      attendanceLogs.filter(
        (log) => normalizeKey(log.site_name) === normalizeKey(siteName),
      ),
    [attendanceLogs, siteName],
  );

  const sitePayrollTotal = useMemo(
    () =>
      round2(siteItems.reduce((sum, item) => sum + (item.total_pay ?? 0), 0)),
    [siteItems],
  );

  const activeItem =
    filteredItems.find((item) => item.id === activeItemId) ??
    siteItems.find((item) => item.id === activeItemId) ??
    null;

  return (
    <>
      <ModalShell
        title={siteName}
        eyebrow="Department Payroll Review"
        subtitle={`${attendancePeriod} | Read-only CEO review`}
        onClose={onClose}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryStat
              label="Employees"
              value={siteItems.length.toLocaleString("en-PH")}
            />
            <SummaryStat
              label="Total Payroll"
              value={`${PESO_SIGN} ${formatPayrollNumber(sitePayrollTotal)}`}
            />
            <SummaryStat
              label="Attendance Logs"
              value={siteLogs.length.toLocaleString("en-PH")}
            />
          </div>

          <div className="rounded-xl border border-apple-mist bg-white">
            <div className="border-b border-apple-mist px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                    Site Employees
                  </p>
                  <p className="mt-1 text-xs text-apple-steel">
                    Open any employee to review payroll details and attendance
                    logs. This view is read-only.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search employee..."
                    className="h-9 min-w-[220px] rounded-lg border border-apple-mist bg-white px-3 text-xs text-apple-charcoal outline-none transition focus:border-[#1f6a37]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAllSiteLogs(true)}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#1f6a37] bg-[#1f6a37] px-3 text-xs font-semibold text-white transition hover:bg-[#18532b]"
                  >
                    <Users size={14} />
                    All Site Logs
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-[520px] overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[rgb(var(--apple-snow))]">
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">
                      Employee
                    </th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">
                      Role
                    </th>
                    <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">
                      Days
                    </th>
                    <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">
                      Hours
                    </th>
                    <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">
                      Paid
                    </th>
                    <th className="px-3 py-2 text-center font-semibold uppercase tracking-wider text-apple-steel">
                      View
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apple-mist">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-medium text-apple-charcoal">
                          {item.employee_name}
                        </td>
                        <td className="px-3 py-2 text-apple-smoke">
                          {item.role_code}
                        </td>
                        <td className="px-3 py-2 text-right text-apple-smoke">
                          {item.days_worked.toLocaleString("en-PH")}
                        </td>
                        <td className="px-3 py-2 text-right text-apple-smoke">
                          {item.hours_worked.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-apple-charcoal">
                          {PESO_SIGN} {formatPayrollNumber(item.total_pay)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => setActiveItemId(item.id)}
                            className="inline-flex rounded-lg border border-[#1f6a37] bg-[#1f6a37] px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-[#18532b]"
                          >
                            View Logs
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-4 text-center text-apple-steel"
                      >
                        No employees match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ModalShell>

      {activeItem ? (
        <EmployeeLogsModal
          attendancePeriod={attendancePeriod}
          item={activeItem}
          attendanceLogs={attendanceLogs}
          dailyTotals={dailyTotals}
          onClose={() => setActiveItemId(null)}
        />
      ) : null}

      {showAllSiteLogs ? (
        <SiteLogsModal
          siteName={siteName}
          attendancePeriod={attendancePeriod}
          logs={siteLogs}
          onClose={() => setShowAllSiteLogs(false)}
        />
      ) : null}
    </>
  );
}

export default function CeoDepartmentReview({
  attendancePeriod,
  payrollItems,
  attendanceLogs,
  dailyTotals,
}: {
  attendancePeriod: string;
  payrollItems: HistoricalDashboardPayrollItem[];
  attendanceLogs: HistoricalDashboardAttendanceLog[];
  dailyTotals: HistoricalDashboardDailyTotal[];
}) {
  const [activeSiteName, setActiveSiteName] = useState<string | null>(null);

  const siteCards = useMemo(() => buildSiteCards(payrollItems), [payrollItems]);
  const activeSite =
    siteCards.find((card) => card.siteName === activeSiteName) ?? null;

  return (
    <>
      <section className="rounded-[12px] bg-white p-5 mb-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[15px] font-semibold text-apple-charcoal">
              Department Cards
            </p>
            <p className="mt-1 text-sm text-apple-steel">
              Open a site to review its employees and logs for the selected
              payroll.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {siteCards.length > 0 ? (
            siteCards.map((card) => (
              <button
                key={card.siteName}
                type="button"
                onClick={() => setActiveSiteName(card.siteName)}
                className="rounded-[16px] bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] p-5 text-left text-white shadow-[0_18px_36px_rgba(22,101,52,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_42px_rgba(22,101,52,0.22)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{card.shortSite}</p>
                    <p className="mt-1 text-xs text-white/65">{card.siteName}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/85">
                    <Eye size={12} />
                    Review
                  </span>
                </div>

                <p className="mt-6 text-[12px] uppercase tracking-[0.28em] text-white/55">
                  Employees
                </p>
                <p className="mt-2 text-[28px] font-semibold tracking-[-0.03em]">
                  {card.employees.toLocaleString("en-PH")}
                </p>

                <p className="mt-6 text-[12px] uppercase tracking-[0.28em] text-white/55">
                  Total Payroll
                </p>
                <p className="mt-2 text-[30px] font-semibold tracking-[-0.03em]">
                  {PESO_SIGN} {formatPayrollNumber(card.payrollTotal)}
                </p>
              </button>
            ))
          ) : (
            <div className="rounded-[16px] bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] p-5 text-white shadow-[0_18px_36px_rgba(22,101,52,0.16)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">OPERATIONS</p>
                <span className="text-[11px] text-white/65">DEPT</span>
              </div>
              <p className="mt-8 text-sm text-white/70">
                No approved payroll sites are available yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {activeSite ? (
        <SiteReviewModal
          siteName={activeSite.siteName}
          attendancePeriod={attendancePeriod}
          payrollItems={payrollItems}
          attendanceLogs={attendanceLogs}
          dailyTotals={dailyTotals}
          onClose={() => setActiveSiteName(null)}
        />
      ) : null}
    </>
  );
}
