"use client";

import { useEffect, useState } from "react";
import type { AttendanceRecordInput, PayrollRow } from "@/lib/payrollEngine";
import type { Database, PayrollRunStatus } from "@/types/database";
import type { AttendanceRecord, Employee } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useAppState } from "@/features/app/AppStateProvider";
import {
  normalizeEmployeeNameKey,
  parsePayrollIdentity,
} from "@/features/payroll/utils/payrollMappers";
import {
  buildDailyRows,
  selectAvailableSites,
} from "@/features/attendance/utils/attendanceSelectors";

type AttendanceRecordRow =
  Database["public"]["Tables"]["attendance_records"]["Row"];
type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];
type AttendanceImportRow =
  Database["public"]["Tables"]["attendance_imports"]["Row"];
type PayrollRunRow = Database["public"]["Tables"]["payroll_runs"]["Row"];
type PayrollRunItemRow = Database["public"]["Tables"]["payroll_run_items"]["Row"];

export interface RecentPayrollActivityRow {
  type: string;
  employee: string;
  amount: string;
  status: string;
  method: string;
}

export interface HistoricalDashboardDebug {
  attendanceImportCount: number;
  attendanceRecordCount: number;
  employeeCount: number;
  payrollRunCount: number;
  trackedPayrollRunCount: number;
  payrollRunItemCount: number;
  availableSiteCount: number;
}

export interface HistoricalDashboardPeriodOption {
  key: string;
  label: string;
  siteName: string;
  status: PayrollRunStatus;
  runId: string;
  attendanceImportId: string | null;
  createdAt: string;
}

export interface HistoricalDashboardData {
  employees: Employee[];
  records: AttendanceRecord[];
  payrollRows: PayrollRow[];
  payrollAttendanceInputs: AttendanceRecordInput[];
  availableSites: string[];
  attendancePeriod: string;
  recentActivity: RecentPayrollActivityRow[];
  periodOptions: HistoricalDashboardPeriodOption[];
  selectedPeriodKey: string | null;
  selectedPeriodLabel: string;
  viewerRole: "ceo" | "payroll_manager" | null;
  debug: HistoricalDashboardDebug;
}

interface HistoricalDashboardState {
  data: HistoricalDashboardData | null;
  loading: boolean;
  error: string | null;
  selectedPeriodKey: string | null;
  setSelectedPeriodKey: (value: string | null) => void;
  refreshData: () => void;
}

function formatMoney(value: number): string {
  return `PHP ${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function toMinutes(timeText: string): number {
  const match = timeText.match(/^(\d{1,2}):(\d{2})$/);
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

function mapAttendanceRecords(rows: AttendanceRecordRow[]): AttendanceRecord[] {
  return rows.map((row) => ({
    date: row.log_date,
    employee: row.employee_name,
    logTime: row.log_time,
    type: row.log_type,
    site: row.site_name,
    source: row.log_source,
  }));
}

function mapPayrollRows(
  runItems: PayrollRunItemRow[],
  runsById: Map<string, PayrollRunRow>,
): PayrollRow[] {
  return runItems.map((item) => {
    const run = runsById.get(item.payroll_run_id);
    const ratePerHour = Math.round((item.rate_per_day / 8) * 100) / 100;

    return {
      id: `${item.role_code}|||${item.employee_name}|||${item.site_name}`,
      worker: item.employee_name,
      role: item.role_code,
      site: item.site_name,
      date: run?.period_label ?? "",
      hoursWorked: item.hours_worked,
      overtimeHours: item.overtime_hours,
      defaultRate: ratePerHour,
      customRate: null,
      rate: ratePerHour,
      regularPay: item.regular_pay + item.holiday_pay,
      overtimePay: item.overtime_pay,
      totalPay: item.total_pay,
    };
  });
}

function buildAttendanceInputs(
  records: AttendanceRecord[],
  employees: EmployeeRow[],
): AttendanceRecordInput[] {
  const roleByEmployeeKey = new Map<string, string>();

  employees.forEach((employee) => {
    roleByEmployeeKey.set(
      normalizeEmployeeNameKey(employee.full_name),
      employee.default_role_code?.trim().toUpperCase() || "UNKNOWN",
    );
  });

  return buildDailyRows(records)
    .map((row) => {
      const parsedIdentity = parsePayrollIdentity(row.employee);
      const knownRole =
        roleByEmployeeKey.get(normalizeEmployeeNameKey(parsedIdentity.name)) ??
        roleByEmployeeKey.get(normalizeEmployeeNameKey(row.employee)) ??
        parsedIdentity.role;

      return {
        name: parsedIdentity.name || row.employee,
        role: knownRole,
        site: row.site,
        date: row.date,
        hours: row.hours,
      };
    })
    .filter((row) => row.name.trim().length > 0 && Number.isFinite(row.hours));
}

function buildEmployeesFromAttendance(records: AttendanceRecord[]): Employee[] {
  const grouped = new Map<
    string,
    {
      name: string;
      activeDays: Set<string>;
      regularMinutes: number;
      overtimeMinutes: number;
      time1In: string;
      time1Out: string;
      time2In: string;
      time2Out: string;
      otIn: string;
      otOut: string;
      currentDate: string;
    }
  >();

  for (const record of records) {
    const key = `${record.employee.trim().toLowerCase()}|||${record.date}`;
    const current =
      grouped.get(key) ?? {
        name: record.employee,
        activeDays: new Set<string>(),
        regularMinutes: 0,
        overtimeMinutes: 0,
        time1In: "",
        time1Out: "",
        time2In: "",
        time2Out: "",
        otIn: "",
        otOut: "",
        currentDate: record.date,
      };

    current.activeDays.add(record.date);

    if (record.source === "Time1" && record.type === "IN") current.time1In = record.logTime;
    if (record.source === "Time1" && record.type === "OUT") current.time1Out = record.logTime;
    if (record.source === "Time2" && record.type === "IN") current.time2In = record.logTime;
    if (record.source === "Time2" && record.type === "OUT") current.time2Out = record.logTime;
    if (record.source === "OT" && record.type === "IN") current.otIn = record.logTime;
    if (record.source === "OT" && record.type === "OUT") current.otOut = record.logTime;

    grouped.set(key, current);
  }

  const byEmployee = new Map<
    string,
    { name: string; activeDays: Set<string>; regularMinutes: number; overtimeMinutes: number }
  >();

  for (const daily of grouped.values()) {
    const regularMinutes =
      boundedPairMinutes(daily.time1In, daily.time1Out) +
      boundedPairMinutes(daily.time2In, daily.time2Out);
    const overtimeMinutes = boundedPairMinutes(daily.otIn, daily.otOut);
    const key = daily.name.trim().toLowerCase();
    const employee =
      byEmployee.get(key) ?? {
        name: daily.name,
        activeDays: new Set<string>(),
        regularMinutes: 0,
        overtimeMinutes: 0,
      };

    daily.activeDays.forEach((day) => employee.activeDays.add(day));
    employee.regularMinutes += regularMinutes;
    employee.overtimeMinutes += overtimeMinutes;
    byEmployee.set(key, employee);
  }

  return Array.from(byEmployee.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((employee, index) => ({
      id: index + 1,
      name: employee.name,
      days: employee.activeDays.size,
      regularHours: Math.round((employee.regularMinutes / 60) * 100) / 100,
      otHours: Math.round((employee.overtimeMinutes / 60) * 100) / 100,
      customRateDay: null,
      customRateHour: null,
    }));
}

function buildRecentActivity(
  payrollRows: PayrollRow[],
  trackedRuns: PayrollRunRow[],
): RecentPayrollActivityRow[] {
  const statusByPeriod = new Map<string, PayrollRunStatus>();

  trackedRuns.forEach((run) => {
    statusByPeriod.set(run.period_label, run.status);
  });

  return payrollRows.slice(0, 5).map((row) => ({
    type: row.overtimeHours > 0 ? "Overtime" : "Payroll Run",
    employee: row.worker,
    amount: formatMoney(row.totalPay),
    status: statusByPeriod.get(row.date) === "submitted" ? "Saved" : "Updated",
    method: row.site.split(" ")[0] || "Attendance Import",
  }));
}

function buildAttendancePeriod(
  latestImport: AttendanceImportRow | null,
  latestTrackedRun: PayrollRunRow | null,
): string {
  return (
    latestTrackedRun?.period_label ||
    latestImport?.period_label ||
    "No recorded payroll period yet"
  );
}

function buildPeriodOptions(
  trackedRuns: PayrollRunRow[],
): HistoricalDashboardPeriodOption[] {
  const latestRunByKey = new Map<string, PayrollRunRow>();

  trackedRuns.forEach((run) => {
    const dedupeKey = [run.period_label, run.site_name].join("|||");
    const existing = latestRunByKey.get(dedupeKey);

    if (!existing || run.created_at > existing.created_at) {
      latestRunByKey.set(dedupeKey, run);
    }
  });

  return Array.from(latestRunByKey.values()).map((run) => ({
    key: run.id,
    label: run.period_label,
    siteName: run.site_name,
    status: run.status,
    runId: run.id,
    attendanceImportId: run.attendance_import_id,
    createdAt: run.created_at,
  }));
}

function dedupeTrackedRuns(trackedRuns: PayrollRunRow[]): PayrollRunRow[] {
  const latestRunByKey = new Map<string, PayrollRunRow>();

  trackedRuns.forEach((run) => {
    const dedupeKey = [run.period_label, run.site_name].join("|||");
    const existing = latestRunByKey.get(dedupeKey);

    if (!existing || run.created_at > existing.created_at) {
      latestRunByKey.set(dedupeKey, run);
    }
  });

  return Array.from(latestRunByKey.values()).sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
}

export function useHistoricalDashboardData(): HistoricalDashboardState {
  const { currentAttendanceImportId, currentPayrollRunId, workspaceReset } =
    useAppState();
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [state, setState] = useState<HistoricalDashboardState>({
    data: null,
    loading: true,
    error: null,
    selectedPeriodKey: null,
    setSelectedPeriodKey: () => undefined,
    refreshData: () => undefined,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (cancelled) return;
          setState({
            data: null,
            loading: false,
            error: null,
            selectedPeriodKey,
            setSelectedPeriodKey,
            refreshData: () => setRefreshTick((value) => value + 1),
          });
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          throw new Error(profileError.message);
        }

        const role = (profileData as { role: "ceo" | "payroll_manager" } | null)
          ?.role;
        const isCeo = role === "ceo";

        if (!isCeo && workspaceReset) {
          if (cancelled) return;
          setState({
            data: {
              employees: [],
              records: [],
              payrollRows: [],
              payrollAttendanceInputs: [],
              availableSites: [],
              attendancePeriod: "No recorded payroll period yet",
              recentActivity: [],
              periodOptions: [],
              selectedPeriodKey: null,
              selectedPeriodLabel: "No recorded payroll period yet",
              viewerRole: role ?? null,
              debug: {
                attendanceImportCount: 0,
                attendanceRecordCount: 0,
                employeeCount: 0,
                payrollRunCount: 0,
                trackedPayrollRunCount: 0,
                payrollRunItemCount: 0,
                availableSiteCount: 0,
              },
            },
            loading: false,
            error: null,
            selectedPeriodKey: null,
            setSelectedPeriodKey,
            refreshData: () => setRefreshTick((value) => value + 1),
          });
          return;
        }

        const [
          employeesResult,
          importsResult,
          runsResult,
        ] = await Promise.all([
          supabase
            .from("employees")
            .select(
              "id, employee_code, full_name, default_role_code, site_id, created_at, updated_at",
            ),
          (() => {
            const query = supabase
              .from("attendance_imports")
              .select(
                "id, original_filename, site_id, site_name, period_label, period_start, period_end, storage_path, uploaded_by, raw_rows, removed_entries, created_at",
              )
              .order("created_at", { ascending: false });

            if (!isCeo) {
              return query.eq("uploaded_by", user.id).limit(50);
            }

            return query.limit(50);
          })(),
          (() => {
            const query = supabase
              .from("payroll_runs")
              .select(
                "id, attendance_import_id, site_id, site_name, period_label, period_start, period_end, status, created_by, submitted_by, approved_by, submitted_at, approved_at, rejected_at, rejection_reason, gross_total, net_total, created_at, updated_at",
              )
              .order("created_at", { ascending: false });

            if (!isCeo) {
              return query.eq("created_by", user.id).limit(100);
            }

            return query.limit(100);
          })(),
        ]);

        if (
          employeesResult.error ||
          importsResult.error ||
          runsResult.error
        ) {
          throw new Error(
            [
              employeesResult.error?.message,
              importsResult.error?.message,
              runsResult.error?.message,
            ]
              .filter(Boolean)
              .join(" | ") || "Unable to load historical dashboard data.",
          );
        }

        const employeeRows = (employeesResult.data ?? []) as EmployeeRow[];
        const importRows = (importsResult.data ?? []) as AttendanceImportRow[];
        const payrollRuns = (runsResult.data ?? []) as PayrollRunRow[];
        const trackedRuns = payrollRuns.filter((run) => run.status !== "rejected");
        const dedupedTrackedRuns = dedupeTrackedRuns(trackedRuns);
        const periodOptions = buildPeriodOptions(dedupedTrackedRuns);
        const selectedRun =
          dedupedTrackedRuns.find((run) => run.id === selectedPeriodKey) ??
          dedupedTrackedRuns.find((run) => run.id === currentPayrollRunId) ??
          dedupedTrackedRuns[0] ??
          null;
        const effectiveImportId = isCeo
          ? selectedRun?.attendance_import_id ?? null
          : selectedRun?.attendance_import_id ??
            currentAttendanceImportId ??
            importRows[0]?.id ??
            null;

        const attendanceResult =
          effectiveImportId
            ? await supabase
                .from("attendance_records")
                .select(
                  "id, import_id, employee_id, employee_name, log_date, log_time, log_type, log_source, site_name, created_at",
                )
                .eq("import_id", effectiveImportId)
                .order("log_date", { ascending: false })
                .order("log_time", { ascending: false })
            : { data: [], error: null };

        if (attendanceResult.error) {
          throw new Error(
            `[HISTORICAL_LOAD_ATTENDANCE_FAILED] ${attendanceResult.error.message}`,
          );
        }

        const trackedRunIds = selectedRun ? [selectedRun.id] : [];

        const payrollItemsResult =
          trackedRunIds.length > 0
            ? await supabase
                .from("payroll_run_items")
                .select(
                  "id, payroll_run_id, employee_id, employee_name, role_code, site_name, days_worked, hours_worked, overtime_hours, rate_per_day, regular_pay, overtime_pay, holiday_pay, deductions_total, total_pay, created_at",
                )
                .in("payroll_run_id", trackedRunIds)
                .order("created_at", { ascending: false })
            : { data: [], error: null };

        if (payrollItemsResult.error) {
          throw new Error(
            `[HISTORICAL_LOAD_ITEMS_FAILED] ${payrollItemsResult.error.message}`,
          );
        }

        const attendanceRows = (attendanceResult.data ??
          []) as AttendanceRecordRow[];
        const records = mapAttendanceRecords(attendanceRows);
        const trackedRunsById = new Map(dedupedTrackedRuns.map((run) => [run.id, run]));
        const payrollRows = mapPayrollRows(
          (payrollItemsResult.data ?? []) as PayrollRunItemRow[],
          trackedRunsById,
        );
        const payrollAttendanceInputs = buildAttendanceInputs(records, employeeRows);
        const employees = buildEmployeesFromAttendance(records);
        const availableSites = selectAvailableSites(records);
        const attendancePeriod = buildAttendancePeriod(
          importRows.find((entry) => entry.id === effectiveImportId) ?? importRows[0] ?? null,
          selectedRun,
        );

        if (cancelled) return;

        const resolvedSelectedPeriodKey = selectedRun?.id ?? null;

        if (resolvedSelectedPeriodKey !== selectedPeriodKey) {
          setSelectedPeriodKey(resolvedSelectedPeriodKey);
        }

        setState({
          data: {
            employees,
            records,
            payrollRows,
            payrollAttendanceInputs,
            availableSites,
            attendancePeriod,
            recentActivity: buildRecentActivity(payrollRows, dedupedTrackedRuns),
            periodOptions,
            selectedPeriodKey: resolvedSelectedPeriodKey,
            selectedPeriodLabel: attendancePeriod,
            viewerRole: role ?? null,
            debug: {
              attendanceImportCount: importRows.length,
              attendanceRecordCount: attendanceRows.length,
              employeeCount: employees.length,
              payrollRunCount: payrollRuns.length,
              trackedPayrollRunCount: dedupedTrackedRuns.length,
              payrollRunItemCount: (payrollItemsResult.data ?? []).length,
              availableSiteCount: availableSites.length,
            },
          },
          loading: false,
          error: null,
          selectedPeriodKey: resolvedSelectedPeriodKey,
          setSelectedPeriodKey,
          refreshData: () => setRefreshTick((value) => value + 1),
        });
      } catch (error) {
        if (cancelled) return;

        setState({
          data: null,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load dashboard history.",
          selectedPeriodKey,
          setSelectedPeriodKey,
          refreshData: () => setRefreshTick((value) => value + 1),
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    currentAttendanceImportId,
    currentPayrollRunId,
    refreshTick,
    workspaceReset,
    selectedPeriodKey,
  ]);

  return {
    ...state,
    refreshData: () => setRefreshTick((value) => value + 1),
    selectedPeriodKey,
    setSelectedPeriodKey,
  };
}
