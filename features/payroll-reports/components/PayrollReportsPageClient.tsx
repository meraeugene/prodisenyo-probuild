"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  MoreHorizontal,
  RefreshCw,
  ScrollText,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { createPortal } from "react-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import {
  approvePayrollReportAction,
  deletePayrollReportAction,
  rejectPayrollReportAction,
} from "@/actions/payroll";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import type { DailyLogRow } from "@/types";
import {
  extractSiteName,
  formatPayrollNumber,
} from "@/features/payroll/utils/payrollFormatters";
import {
  buildEditingPayrollLogs,
  computeBasePay,
} from "@/features/payroll/utils/payrollSelectors";
import { normalizeEmployeeNameKey } from "@/features/payroll/utils/payrollMappers";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import type { PayrollRow } from "@/lib/payrollEngine";
import type { Database, PayrollRunStatus } from "@/types/database";

type PayrollRunRow = Pick<
  Database["public"]["Tables"]["payroll_runs"]["Row"],
  | "id"
  | "attendance_import_id"
  | "site_name"
  | "period_label"
  | "period_start"
  | "period_end"
  | "status"
  | "net_total"
  | "created_at"
  | "submitted_at"
>;

type PayrollRunItemRow = Pick<
  Database["public"]["Tables"]["payroll_run_items"]["Row"],
  | "id"
  | "employee_name"
  | "role_code"
  | "site_name"
  | "days_worked"
  | "hours_worked"
  | "overtime_hours"
  | "rate_per_day"
  | "regular_pay"
  | "overtime_pay"
  | "holiday_pay"
  | "deductions_total"
  | "total_pay"
>;

type AttendanceLogRow = Pick<
  Database["public"]["Tables"]["attendance_records"]["Row"],
  | "id"
  | "employee_name"
  | "log_date"
  | "log_time"
  | "log_type"
  | "log_source"
  | "site_name"
>;

type PayrollRunDailyTotalRow = Pick<
  Database["public"]["Tables"]["payroll_run_daily_totals"]["Row"],
  | "id"
  | "payroll_run_item_id"
  | "employee_name"
  | "role_code"
  | "site_name"
  | "payout_date"
  | "hours_worked"
  | "total_pay"
>;

interface ReportDetailsState {
  loading: boolean;
  error: string | null;
  payrollItems: PayrollRunItemRow[];
  attendanceLogs: AttendanceLogRow[];
  dailyTotals: PayrollRunDailyTotalRow[];
}

interface ReportActionsMenuState {
  runId: string;
  top: number;
  left: number;
}

interface ReportSiteSummary {
  siteName: string;
  employees: number;
  payroll: number;
  hours: number;
}

interface ReportTrendPoint {
  date: string;
  label: string;
  paid: number;
  hours: number;
  employees: number;
}

interface ReportCompositionDatum {
  name: string;
  value: number;
  color: string;
}

const EMPTY_PAYROLL_ITEMS: PayrollRunItemRow[] = [];
const EMPTY_ATTENDANCE_LOGS: AttendanceLogRow[] = [];
const EMPTY_DAILY_TOTALS: PayrollRunDailyTotalRow[] = [];

const PESO_SIGN = "\u20B1";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function statusBadgeClass(status: PayrollRunStatus): string {
  if (status === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "submitted") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "draft") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

function statusLabel(status: PayrollRunStatus): string {
  if (status === "submitted") return "Pending";
  if (status === "approved") return "Approved";
  if (status === "draft") return "Draft";
  return "Rejected";
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function formatDateTime(value: string | null): string {
  if (!value) return "Not submitted";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not submitted";
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPeso(value: number): string {
  return `${PESO_SIGN} ${formatPayrollNumber(value)}`;
}

function formatCompactValue(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function formatLogDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function formatLogTime(value: string | null): string {
  if (!value) return "--";
  const date = new Date(`1970-01-01T${value}`);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
}

function formatPeriodLabel(report: PayrollRunRow): string {
  if (report.period_start && report.period_end) return `${report.period_start} to ${report.period_end}`;
  return report.period_label || "Unknown period";
}

function formatChartDateLabel(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function splitSiteNames(value: string): string[] {
  return value
    .split(",")
    .map((site) => extractSiteName(site) || site.trim())
    .filter((site) => site.length > 0);
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

function buildPayrollStyleDailyRows(logs: AttendanceLogRow[]): DailyLogRow[] {
  const map = new Map<string, DailyLogRow>();

  for (const log of logs) {
    const site = extractSiteName(log.site_name ?? "") || log.site_name?.trim() || "Unknown Site";
    const employee = log.employee_name?.trim() || "Unknown Employee";
    const employeeKey = normalizeEmployeeNameKey(employee);
    const key = `${employeeKey}|||${log.log_date}|||${site.toLowerCase()}`;
    const row =
      map.get(key) ??
      {
        date: log.log_date,
        employee,
        time1In: "",
        time1Out: "",
        time2In: "",
        time2Out: "",
        otIn: "",
        otOut: "",
        hours: 0,
        site,
      };

    const currentMinutes = toMinutes(log.log_time);
    if (employee.length > row.employee.length) {
      row.employee = employee;
    }

    if (log.log_source === "Time1") {
      if (log.log_type === "IN") {
        row.time1In =
          !row.time1In || (currentMinutes >= 0 && currentMinutes < toMinutes(row.time1In))
            ? log.log_time ?? ""
            : row.time1In;
      } else {
        row.time1Out =
          !row.time1Out || (currentMinutes >= 0 && currentMinutes > toMinutes(row.time1Out))
            ? log.log_time ?? ""
            : row.time1Out;
      }
    }

    if (log.log_source === "Time2") {
      if (log.log_type === "IN") {
        row.time2In =
          !row.time2In || (currentMinutes >= 0 && currentMinutes < toMinutes(row.time2In))
            ? log.log_time ?? ""
            : row.time2In;
      } else {
        row.time2Out =
          !row.time2Out || (currentMinutes >= 0 && currentMinutes > toMinutes(row.time2Out))
            ? log.log_time ?? ""
            : row.time2Out;
      }
    }

    if (log.log_source === "OT") {
      if (log.log_type === "IN") {
        row.otIn =
          !row.otIn || (currentMinutes >= 0 && currentMinutes < toMinutes(row.otIn))
            ? log.log_time ?? ""
            : row.otIn;
      } else {
        row.otOut =
          !row.otOut || (currentMinutes >= 0 && currentMinutes > toMinutes(row.otOut))
            ? log.log_time ?? ""
            : row.otOut;
      }
    }

    map.set(key, row);
  }

  return Array.from(map.values())
    .map((row) => ({
      ...row,
      hours: round2(
        pairHours(row.time1In || null, row.time1Out || null) +
          pairHours(row.time2In || null, row.time2Out || null) +
          pairHours(row.otIn || null, row.otOut || null),
      ),
    }))
    .sort((a, b) => {
      const byDate = a.date.localeCompare(b.date);
      if (byDate !== 0) return byDate;
      const bySite = a.site.localeCompare(b.site);
      if (bySite !== 0) return bySite;
      return a.employee.localeCompare(b.employee);
    });
}

function buildSiteSummaries(payrollItems: PayrollRunItemRow[]): ReportSiteSummary[] {
  const siteMap = new Map<
    string,
    { employeeIds: Set<string>; payroll: number; hours: number }
  >();

  for (const item of payrollItems) {
    const siteNames = splitSiteNames(item.site_name);
    const normalizedSiteNames = siteNames.length > 0 ? siteNames : ["Unknown Site"];
    const payrollShare = normalizedSiteNames.length > 0 ? item.total_pay / normalizedSiteNames.length : item.total_pay;
    const hoursShare = normalizedSiteNames.length > 0 ? item.hours_worked / normalizedSiteNames.length : item.hours_worked;

    for (const siteName of normalizedSiteNames) {
      const existing =
        siteMap.get(siteName) ?? {
          employeeIds: new Set<string>(),
          payroll: 0,
          hours: 0,
        };
      existing.employeeIds.add(item.id);
      existing.payroll = round2(existing.payroll + payrollShare);
      existing.hours = round2(existing.hours + hoursShare);
      siteMap.set(siteName, existing);
    }
  }

  return Array.from(siteMap.entries())
    .map(([siteName, value]) => ({
      siteName,
      employees: value.employeeIds.size,
      payroll: round2(value.payroll),
      hours: round2(value.hours),
    }))
    .sort((a, b) => b.payroll - a.payroll);
}

function buildDailyTrend(dailyTotals: PayrollRunDailyTotalRow[]): ReportTrendPoint[] {
  const dateMap = new Map<
    string,
    { paid: number; hours: number; employeeIds: Set<string> }
  >();

  for (const row of dailyTotals) {
    const existing =
      dateMap.get(row.payout_date) ?? {
        paid: 0,
        hours: 0,
        employeeIds: new Set<string>(),
      };
    existing.paid = round2(existing.paid + (row.total_pay ?? 0));
    existing.hours = round2(existing.hours + (row.hours_worked ?? 0));
    if (row.payroll_run_item_id) existing.employeeIds.add(row.payroll_run_item_id);
    dateMap.set(row.payout_date, existing);
  }

  return Array.from(dateMap.entries())
    .map(([date, value]) => ({
      date,
      label: formatChartDateLabel(date),
      paid: round2(value.paid),
      hours: round2(value.hours),
      employees: value.employeeIds.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildSiteDistribution(payrollItems: PayrollRunItemRow[]): ReportCompositionDatum[] {
  const colors = ["#14532d", "#166534", "#15803d", "#16a34a", "#22c55e", "#4ade80"];
  return buildSiteSummaries(payrollItems).map((item, index) => ({
    name: item.siteName,
    value: item.payroll,
    color: colors[index % colors.length],
  }));
}

function EmployeeLogsModal({
  report,
  item,
  attendanceLogs,
  onClose,
}: {
  report: PayrollRunRow;
  item: PayrollRunItemRow;
  attendanceLogs: AttendanceLogRow[];
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  const scopedLogs = useMemo(
    () => buildPayrollStyleDailyRows(attendanceLogs),
    [attendanceLogs],
  );
  const payrollStyleRow = useMemo<PayrollRow>(
    () => ({
      id: item.id,
      worker: item.employee_name,
      role: item.role_code,
      site: item.site_name,
      date: formatPeriodLabel(report),
      hoursWorked: item.hours_worked,
      overtimeHours: item.overtime_hours,
      defaultRate: item.rate_per_day / 8,
      customRate: null,
      rate: item.rate_per_day / 8,
      regularPay: item.regular_pay,
      overtimePay: item.overtime_pay,
      totalPay: item.total_pay,
    }),
    [item, report],
  );
  const dailyRows = useMemo(
    () => buildEditingPayrollLogs(scopedLogs, payrollStyleRow, formatPeriodLabel(report)),
    [scopedLogs, payrollStyleRow, report],
  );
  const scopedDailyTotals = useMemo(() => {
    const totalsByDate = new Map<string, { hours: number; paid: number }>();

    for (const row of dailyRows) {
      const existing = totalsByDate.get(row.date) ?? { hours: 0, paid: 0 };
      existing.hours = round2(existing.hours + row.hours);
      totalsByDate.set(row.date, existing);
    }

    return Array.from(totalsByDate.entries())
      .map(([date, value]) => ({
        id: `${item.id}-${date}`,
        payout_date: date,
        hours_worked: value.hours,
        total_pay: computeBasePay(value.hours, item.rate_per_day),
      }))
      .sort((a, b) => a.payout_date.localeCompare(b.payout_date));
  }, [dailyRows, item.id, item.rate_per_day]);

  const attendanceDays = dailyRows.filter((row) => row.hours > 0).length;
  const inLogs = dailyRows.filter((row) => row.time1In || row.time2In || row.otIn).length;
  const outLogs = dailyRows.filter((row) => row.time1Out || row.time2Out || row.otOut).length;
  const otLogs = dailyRows.filter((row) => row.otIn || row.otOut).length;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl  bg-white shadow-[0_28px_80px_rgba(15,23,42,0.24)]">
        <div className="border-b border-apple-mist bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Calculation Details</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{item.employee_name}</h2>
              <p className="mt-2 text-sm text-white/80">{item.role_code} | {item.site_name} | {formatPeriodLabel(report)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close employee view logs"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="min-h-0 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Days Worked" value={item.days_worked.toLocaleString("en-PH")} />
            <SummaryCard label="Hours Worked" value={item.hours_worked.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
            <SummaryCard label="Overtime Hours" value={item.overtime_hours.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
            <SummaryCard label="Total Paid" value={`${PESO_SIGN} ${formatPayrollNumber(item.total_pay)}`} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-apple-mist bg-white">
              <div className="border-b border-apple-mist px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">Payroll Analytics</p>
              </div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-apple-mist">
                  <MetricRow label="Regular Pay" value={`${PESO_SIGN} ${formatPayrollNumber(item.regular_pay)}`} />
                  <MetricRow label="Overtime Pay" value={`${PESO_SIGN} ${formatPayrollNumber(item.overtime_pay)}`} />
                  <MetricRow label="Holiday Pay" value={`${PESO_SIGN} ${formatPayrollNumber(item.holiday_pay)}`} />
                  <MetricRow label="Deductions" value={`${PESO_SIGN} ${formatPayrollNumber(item.deductions_total)}`} valueClass="text-rose-700" />
                  <MetricRow label="Net Paid" value={`${PESO_SIGN} ${formatPayrollNumber(item.total_pay)}`} valueClass="font-bold" />
                </tbody>
              </table>
            </div>

            <div className="overflow-hidden rounded-xl border border-apple-mist bg-white">
              <div className="border-b border-apple-mist px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">Attendance Analytics</p>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 ">
                <SummaryChip label="Logged Days" value={attendanceDays} />
                <SummaryChip label="IN Logs" value={inLogs} />
                <SummaryChip label="OUT Logs" value={outLogs} />
                <SummaryChip label="OT Logs" value={otLogs} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-apple-mist bg-white">
              <div className="border-b border-apple-mist px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">All Report Logs</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[rgb(var(--apple-snow))]">
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Date</th>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Site</th>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Time1</th>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Time2</th>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">OT</th>
                      <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-apple-mist">
                    {dailyRows.length > 0 ? (
                      dailyRows.map((row) => (
                        <tr key={`${row.date}|||${row.site}`}>
                          <td className="px-3 py-2 text-apple-smoke">{formatLogDate(row.date)}</td>
                          <td className="px-3 py-2 text-apple-smoke">{row.site}</td>
                          <td className="px-3 py-2 text-apple-smoke">{formatLogTime(row.time1In || null)} - {formatLogTime(row.time1Out || null)}</td>
                          <td className="px-3 py-2 text-apple-smoke">{formatLogTime(row.time2In || null)} - {formatLogTime(row.time2Out || null)}</td>
                          <td className="px-3 py-2 text-apple-smoke">{formatLogTime(row.otIn || null)} - {formatLogTime(row.otOut || null)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-apple-charcoal">{row.hours.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} className="px-3 py-4 text-center text-apple-steel">No attendance logs found for this employee.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-apple-mist bg-white">
              <div className="border-b border-apple-mist px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">Daily Paid Totals</p>
              </div>
              <div className="max-h-[300px] overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[rgb(var(--apple-snow))]">
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Date</th>
                      <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">Hours</th>
                      <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-apple-mist">
                    {scopedDailyTotals.length > 0 ? (
                      scopedDailyTotals.map((row) => (
                        <tr key={row.id}>
                          <td className="px-3 py-2 text-apple-smoke">{formatLogDate(row.payout_date)}</td>
                          <td className="px-3 py-2 text-right text-apple-smoke">{(row.hours_worked ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-2 text-right font-semibold text-apple-charcoal">{PESO_SIGN} {formatPayrollNumber(row.total_pay ?? 0)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="px-3 py-4 text-center text-apple-steel">No daily paid totals found for this employee.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-emerald-400/25 bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-emerald-400/25 bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value.toLocaleString("en-PH")}</p>
    </div>
  );
}

function MetricRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <tr>
      <td className="px-4 py-2 text-apple-steel">{label}</td>
      <td className={cn("px-4 py-2 text-right font-semibold text-apple-charcoal", valueClass)}>{value}</td>
    </tr>
  );
}

function ReportAnalyticsTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: TooltipProps<any, any> & {
  valueFormatter?: (value: number, name: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="min-w-[156px] rounded-xl border border-apple-mist bg-white px-3 py-2 shadow-[0_10px_28px_rgba(2,6,23,0.08)]">
      {label ? (
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-apple-smoke">
          {label}
        </p>
      ) : null}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const numericValue =
            typeof entry.value === "number" ? entry.value : Number(entry.value ?? 0);
          const name = String(entry.name ?? entry.dataKey ?? "Value");

          return (
            <div key={`${name}-${index}`} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color ?? "rgb(var(--theme-chart-2))" }}
              />
              <span className="text-[11px] text-apple-smoke">{name}</span>
              <span className="ml-auto text-[12px] font-semibold text-apple-charcoal">
                {valueFormatter ? valueFormatter(numericValue, name) : formatPayrollNumber(numericValue)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl bg-[rgb(var(--apple-snow))]"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="h-[320px] animate-pulse rounded-2xl bg-[rgb(var(--apple-snow))]" />
        <div className="space-y-4">
          <div className="h-[152px] animate-pulse rounded-2xl bg-[rgb(var(--apple-snow))]" />
          <div className="h-[152px] animate-pulse rounded-2xl bg-[rgb(var(--apple-snow))]" />
        </div>
      </div>
      <div className="h-[420px] animate-pulse rounded-2xl bg-[rgb(var(--apple-snow))]" />
    </div>
  );
}

function ReportStatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-500/15 bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-4 py-4 text-white shadow-[0_14px_28px_rgba(17,46,26,0.18)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
      {helper ? <p className="mt-2 text-xs text-white/70">{helper}</p> : null}
    </div>
  );
}

function PayrollReportModal({
  report,
  details,
  onClose,
  onRefresh,
}: {
  report: PayrollRunRow;
  details: ReportDetailsState | null;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("all");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

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

  const payrollItems = details?.payrollItems ?? EMPTY_PAYROLL_ITEMS;
  const attendanceLogs = details?.attendanceLogs ?? EMPTY_ATTENDANCE_LOGS;
  const dailyTotals = details?.dailyTotals ?? EMPTY_DAILY_TOTALS;
  const activeItem = payrollItems.find((item) => item.id === activeItemId) ?? null;

  const siteOptions = useMemo(
    () =>
      Array.from(new Set(payrollItems.flatMap((item) => splitSiteNames(item.site_name)))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [payrollItems],
  );
  const filteredPayrollItems = useMemo(() => {
    const searchTerm = normalizeKey(search);
    return payrollItems.filter((item) => {
      const matchesSearch =
        searchTerm.length === 0 || normalizeKey(item.employee_name).includes(searchTerm);
      const matchesSite =
        siteFilter === "all" ||
        splitSiteNames(item.site_name).some(
          (site) => normalizeKey(site) === normalizeKey(siteFilter),
        );
      return matchesSearch && matchesSite;
    });
  }, [payrollItems, search, siteFilter]);
  const siteSummaries = useMemo(() => buildSiteSummaries(payrollItems), [payrollItems]);
  const dailyTrend = useMemo(() => buildDailyTrend(dailyTotals), [dailyTotals]);
  const siteDistribution = useMemo(() => buildSiteDistribution(payrollItems), [payrollItems]);
  const totalPayroll = useMemo(
    () => round2(payrollItems.reduce((sum, item) => sum + item.total_pay, 0)),
    [payrollItems],
  );
  const filteredPayrollTotal = useMemo(
    () => round2(filteredPayrollItems.reduce((sum, item) => sum + item.total_pay, 0)),
    [filteredPayrollItems],
  );
  const totalHoursWorked = useMemo(
    () => round2(payrollItems.reduce((sum, item) => sum + item.hours_worked, 0)),
    [payrollItems],
  );
  const totalOvertimeHours = useMemo(
    () => round2(payrollItems.reduce((sum, item) => sum + item.overtime_hours, 0)),
    [payrollItems],
  );

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="flex max-h-[95vh] w-full max-w-[min(1520px,96vw)] flex-col overflow-hidden rounded-[28px] bg-[#f6faf7] shadow-[0_28px_80px_rgba(15,23,42,0.24)]">
          <div className="border-b border-emerald-950/10 bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-6 py-5 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                  View Reports
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  {formatPeriodLabel(report)}
                </h2>
                <p className="mt-2 text-sm text-white/80">
                  {report.site_name} | {statusLabel(report.status)} | Submitted{" "}
                  {formatDateTime(report.submitted_at ?? report.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Close payroll report modal"
                >
                  <X size={17} />
                </button>
              </div>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto px-6 py-6">
            {!details || details.loading ? (
              <ReportDashboardSkeleton />
            ) : details.error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm font-semibold text-red-700">{details.error}</p>
                <button
                  type="button"
                  onClick={onRefresh}
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <ReportStatCard label="Employees" value={payrollItems.length.toLocaleString("en-PH")} helper="Included in this submitted report" />
                  <ReportStatCard label="Total Payroll" value={formatPeso(totalPayroll)} helper="Submitted payroll amount" />
                  <ReportStatCard label="Hours Worked" value={totalHoursWorked.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} helper="Total payroll hours" />
                  <ReportStatCard label="Overtime Hours" value={totalOvertimeHours.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} helper="Approved overtime included" />
                  <ReportStatCard label="Attendance Logs" value={attendanceLogs.length.toLocaleString("en-PH")} helper="All report log rows loaded" />
                </div>

                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-apple-mist bg-white">
                    <div className="border-b border-apple-mist px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">Daily Payroll Trend</p>
                      <p className="mt-1 text-xs text-apple-steel">Paid totals and worked hours across this submitted report.</p>
                    </div>
                    <div className="h-[320px] px-3 py-4">
                      {dailyTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dailyTrend} margin={{ top: 14, right: 16, left: 18, bottom: 0 }}>
                            <defs>
                              <linearGradient id="payrollReportTrendFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.26} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.03} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#d3eee0" />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#5f6875", fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#5f6875", fontSize: 11 }} tickFormatter={(value) => formatCompactValue(Number(value))} />
                            <Tooltip content={(props) => <ReportAnalyticsTooltip {...props} valueFormatter={(value) => formatPeso(value)} />} />
                            <Area type="monotone" dataKey="paid" name="Paid" stroke="#16a34a" strokeWidth={3.5} fill="url(#payrollReportTrendFill)" dot={false} activeDot={{ r: 5, fill: "#16a34a", stroke: "white", strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-apple-steel">No daily totals were saved for this report yet.</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
                    <div className="overflow-hidden rounded-2xl border border-apple-mist bg-white">
                      <div className="border-b border-apple-mist px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">Site Payroll Breakdown</p>
                      </div>
                      <div className="h-[280px] rounded-[12px] bg-[rgb(var(--apple-snow))] p-4 sm:h-[320px]">
                        {siteSummaries.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={siteSummaries.slice(0, 6)}
                              barCategoryGap="28%"
                              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="rgb(var(--theme-chart-grid))"
                              />
                              <XAxis
                                dataKey="siteName"
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                                tick={{ fill: "rgb(var(--theme-chart-axis))", fontSize: 11 }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "rgb(var(--theme-chart-axis))", fontSize: 11 }}
                                tickFormatter={(value) => formatCompactValue(Number(value))}
                              />
                              <Tooltip
                                content={(props) => (
                                  <ReportAnalyticsTooltip
                                    {...props}
                                    valueFormatter={(value) => formatPeso(value)}
                                  />
                                )}
                                cursor={{ fill: "rgb(var(--theme-chart-cursor))" }}
                              />
                              <Bar dataKey="payroll" name="Payroll" radius={[6, 6, 6, 6]} barSize={44}>
                                {siteSummaries.slice(0, 6).map((entry, index) => (
                                  <Cell
                                    key={`${entry.siteName}-${index}`}
                                    fill={["rgb(var(--theme-chart-1))","rgb(var(--theme-chart-2))","rgb(var(--theme-chart-3))","rgb(var(--theme-chart-4))","rgb(var(--theme-chart-5))","rgb(var(--theme-chart-1))"][index % 6]}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-apple-steel">No site breakdown found.</div>
                        )}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-apple-mist bg-white">
                      <div className="border-b border-apple-mist px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">Payroll Distribution Per Site</p>
                      </div>
                      <div className="px-4 py-4">
                        {siteDistribution.length > 0 ? (
                          <div className="grid h-full min-h-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                            <div className="h-[220px] min-h-0 sm:h-[240px] lg:h-full lg:min-h-[260px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={siteDistribution}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={58}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    stroke="none"
                                  >
                                    {siteDistribution.map((entry) => (
                                      <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    content={(props) => (
                                      <ReportAnalyticsTooltip
                                        {...props}
                                        valueFormatter={(value) => formatPeso(value)}
                                      />
                                    )}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>

                            <div className="min-h-0 pr-1 lg:pr-2">
                              {siteDistribution.map((entry, index) => (
                                <div
                                  key={`${entry.name}-${index}`}
                                  className="flex items-start gap-2 py-1"
                                >
                                  <span
                                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-2xs font-medium text-apple-smoke">
                                      {entry.name}
                                    </p>
                                    <p className="truncate text-sm font-medium text-apple-charcoal">
                                      {formatPeso(entry.value)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-[260px] items-center justify-center text-sm text-apple-steel">No site distribution data found.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_12px_28px_rgba(17,46,26,0.08)]">
                  <div className="border-b border-apple-mist px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">Employee Payrolls</p>
                        <p className="mt-1 text-xs text-apple-steel">Complete employees and payroll values inside this submitted report.</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-semibold text-apple-steel">
                          {filteredPayrollItems.length.toLocaleString("en-PH")} of {payrollItems.length.toLocaleString("en-PH")} employees
                        </p>
                        <p className="mt-1 text-sm font-semibold text-apple-charcoal">
                          Total Payroll Generated: {formatPeso(filteredPayrollTotal)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search employee..."
                        className="h-9 min-w-[220px] rounded-lg border border-apple-mist bg-white px-3 text-xs text-apple-charcoal outline-none transition focus:border-[#1f6a37]"
                      />
                      <select
                        value={siteFilter}
                        onChange={(event) => setSiteFilter(event.target.value)}
                        className="h-9 min-w-[180px] rounded-lg border border-apple-mist bg-white px-3 text-xs text-apple-charcoal outline-none transition focus:border-[#1f6a37]"
                      >
                        <option value="all">All Sites</option>
                        {siteOptions.map((site) => (
                          <option key={site} value={site}>
                            {site}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="max-h-[440px] overflow-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[rgb(var(--apple-snow))]">
                          <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Employee</th>
                          <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Role</th>
                          <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Site</th>
                          <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">Days</th>
                          <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">Hours</th>
                          <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">Rate</th>
                          <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">Paid</th>
                          <th className="px-3 py-2 text-center font-semibold uppercase tracking-wider text-apple-steel">View</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-apple-mist">
                        {filteredPayrollItems.length > 0 ? (
                          filteredPayrollItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-3 py-2 font-medium text-apple-charcoal">{item.employee_name}</td>
                              <td className="px-3 py-2 text-apple-smoke">{item.role_code}</td>
                              <td className="px-3 py-2 text-apple-smoke">{item.site_name}</td>
                              <td className="px-3 py-2 text-right text-apple-smoke">{item.days_worked.toLocaleString("en-PH")}</td>
                              <td className="px-3 py-2 text-right text-apple-smoke">
                                {item.hours_worked.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 text-right text-apple-smoke">{formatPeso(item.rate_per_day)}</td>
                              <td className="px-3 py-2 text-right font-semibold text-apple-charcoal">{formatPeso(item.total_pay)}</td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => setActiveItemId(item.id)}
                                  className="rounded-lg border border-[#1f6a37] bg-[#1f6a37] px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-[#18532b]"
                                >
                                  View Logs
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="px-3 py-4 text-center text-apple-steel">
                              No employees match the current filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeItem ? (
        <EmployeeLogsModal
          report={report}
          item={activeItem}
          attendanceLogs={attendanceLogs}
          onClose={() => setActiveItemId(null)}
        />
      ) : null}
    </>,
    document.body,
  );
}

export default function PayrollReportsPageClient() {
  const [reports, setReports] = useState<PayrollRunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const [pendingDecisionRunId, setPendingDecisionRunId] = useState<string | null>(null);
  const [pendingDecisionAction, setPendingDecisionAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailsByRunId, setDetailsByRunId] = useState<Record<string, ReportDetailsState>>({});
  const [openMenu, setOpenMenu] = useState<ReportActionsMenuState | null>(null);
  const [deleteConfirmReport, setDeleteConfirmReport] = useState<PayrollRunRow | null>(null);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error: loadError } = await supabase
      .from("payroll_runs")
      .select("id, attendance_import_id, site_name, period_label, period_start, period_end, status, net_total, created_at, submitted_at")
      .neq("status", "rejected")
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (loadError) {
      setReports([]);
      setError(loadError.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setReports((data ?? []) as PayrollRunRow[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (!openMenu) return;

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-report-actions-root]")) return;
      setOpenMenu(null);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };
    const closeMenu = () => setOpenMenu(null);

    document.addEventListener("mousedown", handleDocumentMouseDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [openMenu]);

  useEffect(() => {
    if (!deleteConfirmReport) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && deletingRunId !== deleteConfirmReport.id) {
        setDeleteConfirmReport(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [deleteConfirmReport, deletingRunId]);

  const sortedReports = useMemo(
    () => [...reports].sort((a, b) => new Date(b.submitted_at ?? b.created_at).getTime() - new Date(a.submitted_at ?? a.created_at).getTime()),
    [reports],
  );

  useEffect(() => {
    if (!activeReportId) return;
    const report = sortedReports.find((row) => row.id === activeReportId);
    if (!report || detailsByRunId[report.id]) return;
    void loadReportDetails(report);
  }, [activeReportId, detailsByRunId, sortedReports]);

  async function loadReportDetails(report: PayrollRunRow) {
    setDetailsByRunId((prev) => ({
      ...prev,
      [report.id]: { loading: true, error: null, payrollItems: prev[report.id]?.payrollItems ?? [], attendanceLogs: prev[report.id]?.attendanceLogs ?? [], dailyTotals: prev[report.id]?.dailyTotals ?? [] },
    }));

    const supabase = createSupabaseBrowserClient();
    const [itemsResult, logsResult, totalsResult] = await Promise.all([
      supabase
        .from("payroll_run_items")
        .select("id, employee_name, role_code, site_name, days_worked, hours_worked, overtime_hours, rate_per_day, regular_pay, overtime_pay, holiday_pay, deductions_total, total_pay")
        .eq("payroll_run_id", report.id)
        .order("employee_name", { ascending: true }),
      report.attendance_import_id
        ? supabase
            .from("attendance_records")
            .select("id, employee_name, log_date, log_time, log_type, log_source, site_name")
            .eq("import_id", report.attendance_import_id)
            .order("log_date", { ascending: true })
            .order("log_time", { ascending: true })
        : Promise.resolve({ data: [] as AttendanceLogRow[], error: null }),
      supabase
        .from("payroll_run_daily_totals")
        .select("id, payroll_run_item_id, employee_name, role_code, site_name, payout_date, hours_worked, total_pay")
        .eq("payroll_run_id", report.id)
        .order("payout_date", { ascending: true }),
    ]);

    if (itemsResult.error || logsResult.error || totalsResult.error) {
      setDetailsByRunId((prev) => ({
        ...prev,
        [report.id]: {
          loading: false,
          error: itemsResult.error?.message || logsResult.error?.message || totalsResult.error?.message || "Unable to load report logs.",
          payrollItems: [],
          attendanceLogs: [],
          dailyTotals: [],
        },
      }));
      return;
    }

    setDetailsByRunId((prev) => ({
      ...prev,
      [report.id]: {
        loading: false,
        error: null,
        payrollItems: (itemsResult.data ?? []) as PayrollRunItemRow[],
        attendanceLogs: (logsResult.data ?? []) as AttendanceLogRow[],
        dailyTotals: (totalsResult.data ?? []) as PayrollRunDailyTotalRow[],
      },
    }));
  }

  async function handleDeleteReport(report: PayrollRunRow) {
    setDeletingRunId(report.id);
    setError(null);

    try {
      await deletePayrollReportAction(report.id);

      setReports((prev) => prev.filter((row) => row.id !== report.id));
      setDetailsByRunId((prev) => {
        const { [report.id]: _removed, ...rest } = prev;
        return rest;
      });
      setActiveReportId((prev) => (prev === report.id ? null : prev));
      setDeleteConfirmReport(null);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete payroll report.";
      setError(message);
    } finally {
      setDeletingRunId(null);
      setOpenMenu(null);
    }
  }

  async function handleApproveReport(report: PayrollRunRow) {
    setPendingDecisionRunId(report.id);
    setPendingDecisionAction("approve");
    setError(null);

    try {
      const result = await approvePayrollReportAction(report.id);
      setReports((prev) =>
        prev.map((row) =>
          row.id === report.id
            ? {
                ...row,
                status: "approved",
                submitted_at: row.submitted_at ?? result.approvedAt,
              }
            : row,
        ),
      );
    } catch (approveError) {
      setError(
        approveError instanceof Error
          ? approveError.message
          : "Failed to approve payroll report.",
      );
    } finally {
      setPendingDecisionRunId(null);
      setPendingDecisionAction(null);
      setOpenMenu(null);
    }
  }

  async function handleRejectReport(report: PayrollRunRow) {
    setPendingDecisionRunId(report.id);
    setPendingDecisionAction("reject");
    setError(null);

    try {
      await rejectPayrollReportAction(report.id);
      setReports((prev) => prev.filter((row) => row.id !== report.id));
      setDetailsByRunId((prev) => {
        const { [report.id]: _removed, ...rest } = prev;
        return rest;
      });
      setActiveReportId((prev) => (prev === report.id ? null : prev));
    } catch (rejectError) {
      setError(
        rejectError instanceof Error
          ? rejectError.message
          : "Failed to reject payroll report.",
      );
    } finally {
      setPendingDecisionRunId(null);
      setPendingDecisionAction(null);
      setOpenMenu(null);
    }
  }

  const openMenuReport = openMenu ? sortedReports.find((row) => row.id === openMenu.runId) ?? null : null;
  const activeReport = activeReportId ? sortedReports.find((row) => row.id === activeReportId) ?? null : null;
  const activeDetails = activeReport ? detailsByRunId[activeReport.id] ?? null : null;
  const pendingReportsCount = useMemo(
    () => reports.filter((report) => report.status === "submitted").length,
    [reports],
  );

  return (
    <div >
      <DashboardPageHero
        eyebrow="Payroll Reports"
        title="Payroll Report Review"
        description="Pending payroll reports stay here for CEO review. Only approved payroll reports flow into the CEO dashboard totals."
        actions={
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void loadReports();
            }}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[rgb(var(--theme-chart-5))] px-4 text-sm font-semibold text-[rgb(var(--apple-black))] transition hover:bg-[rgb(var(--apple-silver))] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Sync
          </button>
        }
      />

      <section className="rounded-[16px] mt-4 border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">Report Archive</p>
            <h2 className="mt-2 text-xl font-semibold text-apple-charcoal">Pending And Approved Payroll Reports</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <ScrollText size={12} />
            {pendingReportsCount.toLocaleString("en-PH")} pending
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={18} className="animate-spin text-[#1f6a37]" aria-label="Loading reports" />
          </div>
        ) : sortedReports.length === 0 ? (
          <p className="text-sm text-apple-steel">No payroll reports are waiting for review.</p>
        ) : (
          <div className="overflow-x-auto overflow-y-visible rounded-xl border border-apple-mist">
            <table className="min-w-[980px] w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[19%]" />
                <col className="w-[26%]" />
                <col className="w-[18%]" />
                <col className="w-[16%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="bg-[rgb(var(--apple-snow))] text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">Submitted</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">Period</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">Site</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">Total Payroll</th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">Status</th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-mist">
                {sortedReports.map((report) => (
                  <tr key={report.id} className="bg-white">
                    <td className="px-4 py-4 text-apple-smoke">{formatDateTime(report.submitted_at ?? report.created_at)}</td>
                    <td className="px-4 py-4 font-medium text-apple-charcoal">{formatPeriodLabel(report)}</td>
                    <td className="px-4 py-4 text-apple-smoke">{report.site_name}</td>
                    <td className="px-4 py-4 text-right font-semibold text-apple-charcoal">{formatPeso(report.net_total ?? 0)}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider", statusBadgeClass(report.status))}>
                        {statusLabel(report.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={(event) => {
                          const buttonRect = event.currentTarget.getBoundingClientRect();
                          setOpenMenu((prev) =>
                            prev?.runId === report.id
                              ? null
                              : {
                                  runId: report.id,
                                  top: buttonRect.bottom + 6,
                                  left: buttonRect.right,
                                },
                          );
                        }}
                        data-report-actions-root
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-apple-mist bg-white text-apple-charcoal transition hover:border-apple-steel disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Open report actions"
                        disabled={deletingRunId === report.id || pendingDecisionRunId === report.id}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {openMenu && openMenuReport
        ? createPortal(
            <div
              data-report-actions-root
              className="fixed z-[140] min-w-[170px] -translate-x-full overflow-hidden rounded-lg border border-apple-mist bg-white text-left shadow-[0_14px_36px_rgba(16,24,40,0.18)]"
              style={{ top: openMenu.top, left: openMenu.left }}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveReportId(openMenuReport.id);
                  void loadReportDetails(openMenuReport);
                  setOpenMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-apple-charcoal transition hover:bg-emerald-50 hover:text-emerald-800"
              >
                <Eye size={14} />
                View Reports
              </button>
              {openMenuReport.status === "submitted" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      void handleApproveReport(openMenuReport);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={pendingDecisionRunId === openMenuReport.id}
                  >
                    <CheckCircle2 size={14} />
                    {pendingDecisionRunId === openMenuReport.id && pendingDecisionAction === "approve"
                      ? "Updating..."
                      : "Approve Payroll"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleRejectReport(openMenuReport);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={pendingDecisionRunId === openMenuReport.id}
                  >
                    <XCircle size={14} />
                    {pendingDecisionRunId === openMenuReport.id && pendingDecisionAction === "reject"
                      ? "Updating..."
                      : "Reject Payroll"}
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmReport(openMenuReport);
                  setOpenMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={deletingRunId === openMenuReport.id || pendingDecisionRunId === openMenuReport.id}
              >
                <Trash2 size={14} />
                {deletingRunId === openMenuReport.id
                  ? "Deleting..."
                  : "Delete Payroll"}
              </button>
            </div>,
            document.body,
          )
        : null}

      {deleteConfirmReport
        ? createPortal(
            <div
              className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (
                  event.target === event.currentTarget &&
                  deletingRunId !== deleteConfirmReport.id
                ) {
                  setDeleteConfirmReport(null);
                }
              }}
            >
              <div className="w-full max-w-md overflow-hidden rounded-2xl  bg-white shadow-[0_24px_64px_rgba(15,23,42,0.26)]">
                <div className="border-b border-apple-mist bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-5 py-4 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                    Confirm Delete
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
                    Delete Payroll Report?
                  </h3>
                </div>
                <div className="space-y-4 px-5 py-4">
                  <p className="text-sm text-apple-charcoal">
                    Delete payroll report for{" "}
                    <span className="font-semibold">
                      {formatPeriodLabel(deleteConfirmReport)}
                    </span>
                    ? This cannot be undone.
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmReport(null)}
                      disabled={deletingRunId === deleteConfirmReport.id}
                      className="inline-flex h-9 items-center rounded-lg border border-apple-mist bg-white px-3 text-sm font-semibold text-apple-charcoal transition hover:border-apple-steel disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleDeleteReport(deleteConfirmReport);
                      }}
                      disabled={deletingRunId === deleteConfirmReport.id}
                      className="inline-flex h-9 items-center rounded-lg bg-rose-600 px-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingRunId === deleteConfirmReport.id
                        ? "Deleting..."
                        : "Delete Payroll"}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {error ? <section className="rounded-[14px] border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</section> : null}

      {activeReport ? (
        <PayrollReportModal
          report={activeReport}
          details={activeDetails}
          onClose={() => setActiveReportId(null)}
          onRefresh={() => {
            void loadReportDetails(activeReport);
          }}
        />
      ) : null}
    </div>
  );
}
