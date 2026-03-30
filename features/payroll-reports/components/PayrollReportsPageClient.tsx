"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, MoreHorizontal, RefreshCw, ScrollText, Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { deletePayrollReportAction } from "@/actions/payroll";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import { formatPayrollNumber } from "@/features/payroll/utils/payrollFormatters";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
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
  | "gross_total"
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

interface PayrollItemLogFilters {
  search: string;
  site: string;
}

interface ReportActionsMenuState {
  runId: string;
  top: number;
  left: number;
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

const PESO_SIGN = "\u20B1";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function statusBadgeClass(status: PayrollRunStatus): string {
  if (status === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "submitted") return "bg-sky-50 text-sky-700 border-sky-200";
  if (status === "draft") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
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

function splitSiteNames(value: string): string[] {
  return value
    .split(",")
    .map((site) => site.trim())
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

function buildDailyRows(logs: AttendanceLogRow[]): DailyAttendanceRow[] {
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
        row.t1In = !row.t1In || (currentMinutes >= 0 && currentMinutes < toMinutes(row.t1In)) ? log.log_time : row.t1In;
      } else {
        row.t1Out = !row.t1Out || (currentMinutes >= 0 && currentMinutes > toMinutes(row.t1Out)) ? log.log_time : row.t1Out;
      }
    }
    if (log.log_source === "Time2") {
      if (log.log_type === "IN") {
        row.t2In = !row.t2In || (currentMinutes >= 0 && currentMinutes < toMinutes(row.t2In)) ? log.log_time : row.t2In;
      } else {
        row.t2Out = !row.t2Out || (currentMinutes >= 0 && currentMinutes > toMinutes(row.t2Out)) ? log.log_time : row.t2Out;
      }
    }
    if (log.log_source === "OT") {
      if (log.log_type === "IN") {
        row.otIn = !row.otIn || (currentMinutes >= 0 && currentMinutes < toMinutes(row.otIn)) ? log.log_time : row.otIn;
      } else {
        row.otOut = !row.otOut || (currentMinutes >= 0 && currentMinutes > toMinutes(row.otOut)) ? log.log_time : row.otOut;
      }
    }

    map.set(key, row);
  }

  return Array.from(map.values())
    .map((row) => ({ ...row, hours: round2(pairHours(row.t1In, row.t1Out) + pairHours(row.t2In, row.t2Out) + pairHours(row.otIn, row.otOut)) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function EmployeeLogsModal({
  report,
  item,
  attendanceLogs,
  dailyTotals,
  onClose,
}: {
  report: PayrollRunRow;
  item: PayrollRunItemRow;
  attendanceLogs: AttendanceLogRow[];
  dailyTotals: PayrollRunDailyTotalRow[];
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  const scopedLogs = useMemo(
    () =>
      attendanceLogs.filter(
        (log) => normalizeKey(log.employee_name) === normalizeKey(item.employee_name),
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
              (row.role_code ?? "").trim().toUpperCase() === item.role_code.trim().toUpperCase()),
        )
        .sort((a, b) => a.payout_date.localeCompare(b.payout_date)),
    [dailyTotals, item.id, item.employee_name, item.role_code],
  );

  const attendanceDays = new Set(scopedLogs.map((log) => log.log_date)).size;
  const inLogs = scopedLogs.filter((log) => log.log_type === "IN").length;
  const outLogs = scopedLogs.filter((log) => log.log_type === "OUT").length;
  const otLogs = scopedLogs.filter((log) => log.log_source === "OT").length;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
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
                          <td className="px-3 py-2 text-apple-smoke">{formatLogTime(row.t1In)} - {formatLogTime(row.t1Out)}</td>
                          <td className="px-3 py-2 text-apple-smoke">{formatLogTime(row.t2In)} - {formatLogTime(row.t2Out)}</td>
                          <td className="px-3 py-2 text-apple-smoke">{formatLogTime(row.otIn)} - {formatLogTime(row.otOut)}</td>
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

function PayrollItemLogsSectionSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-apple-mist bg-white">
      <div className="border-b border-apple-mist px-3 py-3">
        <div className="h-3 w-32 animate-pulse rounded bg-[rgb(var(--apple-mist))]" />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="h-9 w-[220px] animate-pulse rounded-lg bg-[rgb(var(--apple-snow))]" />
          <div className="h-9 w-[180px] animate-pulse rounded-lg bg-[rgb(var(--apple-snow))]" />
        </div>
      </div>
      <div className="px-3 py-3">
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-9 w-full animate-pulse rounded bg-[rgb(var(--apple-snow))]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PayrollReportsPageClient() {
  const [reports, setReports] = useState<PayrollRunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedRunIds, setExpandedRunIds] = useState<Record<string, boolean>>({});
  const [detailsByRunId, setDetailsByRunId] = useState<Record<string, ReportDetailsState>>({});
  const [filtersByRunId, setFiltersByRunId] = useState<Record<string, PayrollItemLogFilters>>({});
  const [openMenu, setOpenMenu] = useState<ReportActionsMenuState | null>(null);
  const [deleteConfirmReport, setDeleteConfirmReport] = useState<PayrollRunRow | null>(null);
  const [activeModal, setActiveModal] = useState<{ runId: string; itemId: string } | null>(null);

  const loadReports = useCallback(async () => {
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error: loadError } = await supabase
      .from("payroll_runs")
      .select("id, attendance_import_id, site_name, period_label, period_start, period_end, status, gross_total, net_total, created_at, submitted_at")
      .eq("status", "submitted")
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

  async function loadReportDetails(report: PayrollRunRow) {
    setDetailsByRunId((prev) => ({
      ...prev,
      [report.id]: { loading: true, error: null, payrollItems: prev[report.id]?.payrollItems ?? [], attendanceLogs: prev[report.id]?.attendanceLogs ?? [], dailyTotals: prev[report.id]?.dailyTotals ?? [] },
    }));

    const supabase = createSupabaseBrowserClient();
    const [itemsResult, logsResult, totalsResult] = await Promise.all([
      supabase
        .from("payroll_run_items")
        .select("id, employee_name, role_code, site_name, days_worked, hours_worked, overtime_hours, regular_pay, overtime_pay, holiday_pay, deductions_total, total_pay")
        .eq("payroll_run_id", report.id)
        .order("employee_name", { ascending: true }),
      report.attendance_import_id
        ? supabase
            .from("attendance_records")
            .select("id, employee_name, log_date, log_time, log_type, log_source, site_name")
            .eq("import_id", report.attendance_import_id)
            .order("log_date", { ascending: true })
            .order("log_time", { ascending: true })
            .limit(2000)
        : Promise.resolve({ data: [] as AttendanceLogRow[], error: null }),
      supabase
        .from("payroll_run_daily_totals")
        .select("id, payroll_run_item_id, employee_name, role_code, payout_date, hours_worked, total_pay")
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

  function toggleRunDetails(report: PayrollRunRow) {
    const nextOpen = !expandedRunIds[report.id];
    setExpandedRunIds((prev) => ({ ...prev, [report.id]: nextOpen }));
    if (!nextOpen || detailsByRunId[report.id]) return;
    void loadReportDetails(report);
  }

  async function handleDeleteReport(report: PayrollRunRow) {
    setDeletingRunId(report.id);
    setError(null);

    try {
      await deletePayrollReportAction(report.id);

      setReports((prev) => prev.filter((row) => row.id !== report.id));
      setExpandedRunIds((prev) => {
        const { [report.id]: _removed, ...rest } = prev;
        return rest;
      });
      setDetailsByRunId((prev) => {
        const { [report.id]: _removed, ...rest } = prev;
        return rest;
      });
      setFiltersByRunId((prev) => {
        const { [report.id]: _removed, ...rest } = prev;
        return rest;
      });
      setActiveModal((prev) =>
        prev && prev.runId === report.id ? null : prev,
      );
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

  const openMenuReport = openMenu ? sortedReports.find((row) => row.id === openMenu.runId) ?? null : null;
  const openMenuReportExpanded = openMenuReport ? Boolean(expandedRunIds[openMenuReport.id]) : false;
  const activeReport = activeModal ? sortedReports.find((row) => row.id === activeModal.runId) ?? null : null;
  const activeDetails = activeModal ? detailsByRunId[activeModal.runId] : null;
  const activeItem = activeModal ? activeDetails?.payrollItems.find((item) => item.id === activeModal.itemId) ?? null : null;

  return (
    <div >
      <DashboardPageHero
        eyebrow="Payroll Reports"
        title="Submitted Payroll Reports"
        description="Review submitted payroll reports and open each employee's read-only calculation details and logs."
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
            <h2 className="mt-2 text-xl font-semibold text-apple-charcoal">Submitted Payroll Reports</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <ScrollText size={12} />
            {sortedReports.length.toLocaleString("en-PH")} reports
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-apple-steel">Loading reports...</p>
        ) : sortedReports.length === 0 ? (
          <p className="text-sm text-apple-steel">No submitted payroll reports yet.</p>
        ) : (
          <div className="space-y-3">
            {sortedReports.map((report) => {
              const details = detailsByRunId[report.id];
              const isExpanded = Boolean(expandedRunIds[report.id]);
              const currentFilters = filtersByRunId[report.id] ?? {
                search: "",
                site: "all",
              };
              const searchTerm = currentFilters.search.trim().toLowerCase();
              const allPayrollItems = details?.payrollItems ?? [];
              const siteOptions = Array.from(
                new Set(
                  allPayrollItems.flatMap((item) => splitSiteNames(item.site_name)),
                ),
              ).sort((a, b) => a.localeCompare(b));
              const filteredPayrollItems = allPayrollItems.filter((item) => {
                const matchesSearch =
                  searchTerm.length === 0 ||
                  normalizeKey(item.employee_name).includes(
                    normalizeKey(searchTerm),
                  );
                const matchesSite =
                  currentFilters.site === "all" ||
                  splitSiteNames(item.site_name).some(
                    (site) => normalizeKey(site) === normalizeKey(currentFilters.site),
                  );
                return matchesSearch && matchesSite;
              });

              return (
                <div key={report.id} className="rounded-xl border border-apple-mist">
                  <div className="overflow-x-auto overflow-y-visible">
                    <table className="min-w-[980px] w-full text-sm">
                      <thead>
                        <tr className="bg-[rgb(var(--apple-snow))] text-left">
                          <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">Submitted</th>
                          <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">Period</th>
                          <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">Site</th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">Net Total</th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">Gross Total</th>
                          <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">Status</th>
                          <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white">
                          <td className="px-4 py-3 text-apple-smoke">{formatDateTime(report.submitted_at ?? report.created_at)}</td>
                          <td className="px-4 py-3 font-medium text-apple-charcoal">{formatPeriodLabel(report)}</td>
                          <td className="px-4 py-3 text-apple-smoke">{report.site_name}</td>
                          <td className="px-4 py-3 text-right font-semibold text-apple-charcoal">{PESO_SIGN} {formatPayrollNumber(report.net_total ?? 0)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-apple-charcoal">{PESO_SIGN} {formatPayrollNumber(report.gross_total ?? 0)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider", statusBadgeClass(report.status))}>{report.status}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={(event) => {
                                const buttonRect =
                                  event.currentTarget.getBoundingClientRect();
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
                              disabled={deletingRunId === report.id}
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {isExpanded ? (
                    <div className="border-t border-apple-mist bg-[rgb(var(--apple-snow))] p-4">
                      {details?.loading ? (
                        <PayrollItemLogsSectionSkeleton />
                      ) : details?.error ? (
                        <p className="text-sm text-red-700">{details.error}</p>
                      ) : (
                        <div className="overflow-hidden rounded-xl border border-apple-mist bg-white">
                          <div className="border-b border-apple-mist px-3 py-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">Payroll Item Logs</p>
                              <span className="text-[11px] font-semibold text-apple-steel">
                                {filteredPayrollItems.length.toLocaleString("en-PH")} of{" "}
                                {allPayrollItems.length.toLocaleString("en-PH")} employees
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <input
                                type="search"
                                value={currentFilters.search}
                                onChange={(event) =>
                                  setFiltersByRunId((prev) => ({
                                    ...prev,
                                    [report.id]: {
                                      search: event.target.value,
                                      site: prev[report.id]?.site ?? "all",
                                    },
                                  }))
                                }
                                placeholder="Search employee..."
                                className="h-9 min-w-[220px] rounded-lg border border-apple-mist bg-white px-3 text-xs text-apple-charcoal outline-none transition focus:border-[#1f6a37]"
                              />
                              <select
                                value={currentFilters.site}
                                onChange={(event) =>
                                  setFiltersByRunId((prev) => ({
                                    ...prev,
                                    [report.id]: {
                                      search: prev[report.id]?.search ?? "",
                                      site: event.target.value,
                                    },
                                  }))
                                }
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
                          <div className="max-h-[340px] overflow-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-[rgb(var(--apple-snow))]">
                                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Employee</th>
                                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Role</th>
                                  <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">Days</th>
                                  <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">Paid</th>
                                  <th className="px-3 py-2 text-center font-semibold uppercase tracking-wider text-apple-steel">View</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-apple-mist">
                                {filteredPayrollItems.length > 0 ? (
                                  filteredPayrollItems.map((item) => (
                                    <tr key={item.id}>
                                      <td className="px-3 py-2 text-apple-charcoal">{item.employee_name}</td>
                                      <td className="px-3 py-2 text-apple-smoke">{item.role_code}</td>
                                      <td className="px-3 py-2 text-right text-apple-smoke">{item.days_worked.toLocaleString("en-PH")}</td>
                                      <td className="px-3 py-2 text-right font-semibold text-apple-charcoal">{PESO_SIGN} {formatPayrollNumber(item.total_pay)}</td>
                                      <td className="px-3 py-2 text-center">
                                        <button
                                          type="button"
                                          onClick={() => setActiveModal({ runId: report.id, itemId: item.id })}
                                          className="rounded-lg border border-[#1f6a37] bg-[#1f6a37] px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-[#18532b]"
                                        >
                                          View Logs
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={5} className="px-3 py-4 text-center text-apple-steel">
                                      {allPayrollItems.length > 0
                                        ? "No payroll item logs match your filters."
                                        : "No payroll item logs found."}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
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
                  toggleRunDetails(openMenuReport);
                  setOpenMenu(null);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-apple-charcoal transition hover:bg-emerald-50 hover:text-emerald-800",
                  openMenuReportExpanded ? "bg-emerald-50 text-emerald-800" : "",
                )}
              >
                <Eye size={14} />
                {openMenuReportExpanded ? "Hide Logs" : "View Logs"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmReport(openMenuReport);
                  setOpenMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={deletingRunId === openMenuReport.id}
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

      {activeModal && activeReport && activeItem && activeDetails ? (
        <EmployeeLogsModal
          report={activeReport}
          item={activeItem}
          attendanceLogs={activeDetails.attendanceLogs}
          dailyTotals={activeDetails.dailyTotals}
          onClose={() => setActiveModal(null)}
        />
      ) : null}
    </div>
  );
}
