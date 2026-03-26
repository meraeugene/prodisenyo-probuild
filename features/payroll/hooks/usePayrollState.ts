import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AttendanceRecordInput, PayrollRow } from "@/lib/payrollEngine";
import {
  DEFAULT_DAILY_RATE_BY_ROLE,
  ROLE_CODES,
  type RoleCode,
} from "@/lib/payrollConfig";
import { exportPayrollToExcel } from "@/lib/payrollExport";
import type { DailyLogRow, Step2Sort } from "@/types";
import { buildVisiblePages } from "@/features/shared/pagination";
import {
  normalizeNumericInput,
  parseNonNegativeOrFallback,
} from "@/features/payroll/utils/payrollFormatters";
import {
  extractIsoPayrollRange,
  isIsoDateWithinRange,
  normalizePeriodLabel,
} from "@/features/payroll/utils/payrollDateHelpers";
import {
  getLogOverrideKey,
  parsePayrollIdentity,
} from "@/features/payroll/utils/payrollMappers";
import {
  applyLogHourOverrides,
  buildEditingPayrollLogs,
  buildEditingPayrollSummary,
  buildWorkerDateSpanByKey,
  buildEmployeeAttendanceBreakdown,
  buildEmployeeClockInConsistency,
  buildEmployeeDailyHoursTrend,
  buildPayrollBaseRows,
  buildPayrollEditPreview,
  buildPayrollRows,
  calculateTotalEditedLogHours,
  computeBasePay,
  countHolidayBonusDays,
  FIXED_PAY_RATE_PER_DAY,
  filterPayrollLogs,
  filterPayrollRows,
  FULL_WORKDAY_HOURS,
  hasAnyLogHourOverrides,
  summarizePayrollTotals,
} from "@/features/payroll/utils/payrollSelectors";
import type {
  PayrollAdjustmentSet,
  PayrollCashAdvanceEntry,
  PaidHolidayItem,
  PayrollDateRange,
  PayrollEditDraft,
  PayrollOvertimeEntry,
  PayrollPaidLeaveEntry,
  PayrollRowOverride,
} from "@/features/payroll/types";

const PREVIEW_LIMIT = 10;
const MAX_LOG_HOURS_PER_DAY = 16;
const EMPTY_ADJUSTMENTS: PayrollAdjustmentSet = {
  cashAdvanceEntries: [],
  overtimeEntries: [],
  paidLeaveEntries: [],
};

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getLastMondayOfAugust(year: number): string {
  const date = new Date(year, 7, 31);
  while (date.getDay() !== 1) {
    date.setDate(date.getDate() - 1);
  }
  return toIsoDate(year, 8, date.getDate());
}

function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

function toIsoFromDate(date: Date): string {
  return toIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function shiftDate(date: Date, dayOffset: number): string {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + dayOffset);
  return toIsoFromDate(copy);
}

function getPhilippineHolidaysByYear(year: number): PaidHolidayItem[] {
  const fixed: PaidHolidayItem[] = [
    { date: toIsoDate(year, 1, 1), name: "New Year's Day", source: "ph" },
    { date: toIsoDate(year, 2, 25), name: "EDSA People Power Revolution", source: "ph" },
    { date: toIsoDate(year, 4, 9), name: "Araw ng Kagitingan", source: "ph" },
    { date: toIsoDate(year, 5, 1), name: "Labor Day", source: "ph" },
    { date: toIsoDate(year, 6, 12), name: "Independence Day", source: "ph" },
    { date: toIsoDate(year, 8, 21), name: "Ninoy Aquino Day", source: "ph" },
    { date: getLastMondayOfAugust(year), name: "National Heroes Day", source: "ph" },
    { date: toIsoDate(year, 11, 30), name: "Bonifacio Day", source: "ph" },
    { date: toIsoDate(year, 12, 8), name: "Feast of the Immaculate Conception", source: "ph" },
    { date: toIsoDate(year, 12, 25), name: "Christmas Day", source: "ph" },
    { date: toIsoDate(year, 12, 30), name: "Rizal Day", source: "ph" },
    { date: toIsoDate(year, 12, 31), name: "Last Day of the Year", source: "ph" },
  ];

  const easterSunday = getEasterSunday(year);
  const holyWeekItems: PaidHolidayItem[] = [
    { date: shiftDate(easterSunday, -3), name: "Maundy Thursday", source: "ph" },
    { date: shiftDate(easterSunday, -2), name: "Good Friday", source: "ph" },
  ];

  const merged = new Map<string, PaidHolidayItem>();
  [...fixed, ...holyWeekItems].forEach((holiday) => {
    merged.set(holiday.date, holiday);
  });

  return Array.from(merged.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function mergeHolidayItems(
  existing: PaidHolidayItem[],
  additions: PaidHolidayItem[],
): PaidHolidayItem[] {
  const byDate = new Map<string, PaidHolidayItem>();

  for (const holiday of existing) {
    byDate.set(holiday.date, holiday);
  }

  for (const holiday of additions) {
    const existingHoliday = byDate.get(holiday.date);
    if (!existingHoliday || holiday.source === "manual") {
      byDate.set(holiday.date, holiday);
    }
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function buildDailyHoursByWorker(
  logs: AttendanceRecordInput[],
): Map<string, Map<string, number>> {
  const hoursByWorker = new Map<string, Map<string, number>>();

  for (const log of logs) {
    const key = `${log.role}|||${log.name}`;
    const byDate = hoursByWorker.get(key) ?? new Map<string, number>();
    byDate.set(log.date, (byDate.get(log.date) ?? 0) + log.hours);
    hoursByWorker.set(key, byDate);
  }

  return hoursByWorker;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function sanitizeCashAdvanceEntries(
  entries: PayrollCashAdvanceEntry[] | undefined,
): PayrollCashAdvanceEntry[] {
  if (!entries || entries.length === 0) return [];
  return entries
    .map((entry) => ({
      id: String(entry.id || `${Date.now()}-${Math.random()}`),
      amount:
        Number.isFinite(entry.amount) && entry.amount > 0
          ? round2(entry.amount)
          : 0,
      notes: String(entry.notes ?? "").trim(),
    }))
    .filter((entry) => entry.amount > 0);
}

function sanitizeOvertimeEntries(
  entries: PayrollOvertimeEntry[] | undefined,
): PayrollOvertimeEntry[] {
  if (!entries || entries.length === 0) return [];
  return entries
    .map((entry) => ({
      id: String(entry.id || `${Date.now()}-${Math.random()}`),
      hours: Number.isFinite(entry.hours) && entry.hours > 0 ? round2(entry.hours) : 0,
      pay: Number.isFinite(entry.pay) && entry.pay > 0 ? round2(entry.pay) : 0,
      notes: String(entry.notes ?? "").trim(),
    }))
    .filter((entry) => entry.hours > 0 || entry.pay > 0);
}

function sanitizePaidLeaveEntries(
  entries: PayrollPaidLeaveEntry[] | undefined,
): PayrollPaidLeaveEntry[] {
  if (!entries || entries.length === 0) return [];
  return entries
    .map((entry) => ({
      id: String(entry.id || `${Date.now()}-${Math.random()}`),
      days: Number.isFinite(entry.days) && entry.days > 0 ? round2(entry.days) : 0,
      pay: Number.isFinite(entry.pay) && entry.pay > 0 ? round2(entry.pay) : 0,
      notes: String(entry.notes ?? "").trim(),
    }))
    .filter((entry) => entry.days > 0 || entry.pay > 0);
}

function sumCashAdvance(entries: PayrollCashAdvanceEntry[] | undefined): number {
  return round2((entries ?? []).reduce((sum, entry) => sum + entry.amount, 0));
}

function sumOvertimePay(entries: PayrollOvertimeEntry[] | undefined): number {
  return round2((entries ?? []).reduce((sum, entry) => sum + entry.pay, 0));
}

function sumOvertimeHours(entries: PayrollOvertimeEntry[] | undefined): number {
  return round2((entries ?? []).reduce((sum, entry) => sum + entry.hours, 0));
}

function sumPaidLeavePay(entries: PayrollPaidLeaveEntry[] | undefined): number {
  return round2((entries ?? []).reduce((sum, entry) => sum + entry.pay, 0));
}

export interface UsePayrollStateArgs {
  dailyRows: DailyLogRow[];
  attendancePeriod: string;
  availableSites: string[];
}

export interface UsePayrollStateResult {
  payrollRoleRates: Record<RoleCode, number>;
  setPayrollRoleRates: (
    value:
      | Record<RoleCode, number>
      | ((prev: Record<RoleCode, number>) => Record<RoleCode, number>),
  ) => void;
  payrollGenerated: boolean;
  setPayrollGenerated: (value: boolean) => void;
  payrollTab: "payroll" | "logs";
  setPayrollTab: (value: "payroll" | "logs") => void;
  payrollPage: number;
  setPayrollPage: (value: number | ((prev: number) => number)) => void;
  payrollSiteFilter: string;
  setPayrollSiteFilter: (value: string) => void;
  payrollNameFilter: string;
  setPayrollNameFilter: (value: string) => void;
  payrollDateFilter: string;
  setPayrollDateFilter: (value: string) => void;
  payrollSort: Step2Sort;
  setPayrollSort: (value: Step2Sort) => void;
  payrollRoleFilter: RoleCode | "ALL";
  setPayrollRoleFilter: (value: RoleCode | "ALL") => void;
  payrollSaveNotice: string | null;
  showPayrollRateModal: boolean;
  payrollRateDraft: Record<RoleCode, number>;
  setPayrollRateDraft: (
    value:
      | Record<RoleCode, number>
      | ((prev: Record<RoleCode, number>) => Record<RoleCode, number>),
  ) => void;
  payrollAttendanceInputs: AttendanceRecordInput[];
  payrollOverrides: Record<string, PayrollRowOverride>;
  setPayrollOverrides: (
    value:
      | Record<string, PayrollRowOverride>
      | ((
          prev: Record<string, PayrollRowOverride>,
        ) => Record<string, PayrollRowOverride>),
  ) => void;
  payrollRows: PayrollRow[];
  payrollBaseComputedRows: PayrollRow[];
  filteredPayrollRows: PayrollRow[];
  filteredPayrollLogs: AttendanceRecordInput[];
  paidHolidays: PaidHolidayItem[];
  setPaidHolidays: (
    value:
      | PaidHolidayItem[]
      | ((prev: PaidHolidayItem[]) => PaidHolidayItem[]),
  ) => void;
  payrollDateRange: PayrollDateRange | null;
  payableHolidayDays: number;
  payrollActiveRowsCount: number;
  payrollTotalPages: number;
  payrollPreviewStart: number;
  payrollPreviewEnd: number;
  payrollPreviewRows: PayrollRow[];
  payrollPreviewLogs: AttendanceRecordInput[];
  payrollTotals: { hours: number; pay: number };
  payrollPages: number[];
  editingPayrollRow: PayrollRow | null;
  editingPayrollLogs: DailyLogRow[];
  editingPayrollSummary: {
    attendanceDays: number;
    absenceDays: number;
    regularHours: number;
    otNormalHours: number;
  };
  editingPayrollAdjustments: PayrollAdjustmentSet;
  editingPayrollLogsForAnalytics: DailyLogRow[];
  payrollEditDraft: PayrollEditDraft | null;
  setPayrollEditDraft: (
    value: PayrollEditDraft | null | ((prev: PayrollEditDraft | null) => PayrollEditDraft | null),
  ) => void;
  payrollEditPreview: PayrollRow | null;
  logHourOverrides: Record<string, number>;
  setLogHourOverrides: (
    value:
      | Record<string, number>
      | ((prev: Record<string, number>) => Record<string, number>),
  ) => void;
  hasLogHourOverrides: boolean;
  totalEditedLogHours: number;
  employeeDailyHoursTrend: { date: string; isoDate: string; hoursWorked: number }[];
  employeeAttendanceBreakdown: { name: string; value: number }[];
  employeeClockInConsistency: {
    date: string;
    isoDate: string;
    timeIn: number;
    timeInLabel: string;
  }[];
  clearPayrollFilters: () => void;
  resetPayrollState: () => void;
  handleGeneratePayroll: () => boolean;
  handleExportPayroll: () => void;
  openPayrollRateModal: () => void;
  closePayrollRateModal: () => void;
  applyPayrollRates: () => void;
  addManualPaidHoliday: (date: string, name: string) => void;
  removePaidHoliday: (date: string) => void;
  clearPaidHolidays: () => void;
  loadPhilippinePaidHolidays: () => void;
  openPayrollEditModal: (row: PayrollRow) => void;
  closePayrollEditModal: () => void;
  savePayrollEdit: (adjustments?: PayrollAdjustmentSet) => void;
  updateLogHour: (log: DailyLogRow, valueText: string) => void;
  normalizeNumericInput: (value: string) => string;
  roleCodes: RoleCode[];
}

export function usePayrollState({
  dailyRows,
  attendancePeriod,
  availableSites,
}: UsePayrollStateArgs): UsePayrollStateResult {
  const [payrollRoleRates, setPayrollRoleRates] = useState<
    Record<RoleCode, number>
  >(DEFAULT_DAILY_RATE_BY_ROLE);
  const [payrollGenerated, setPayrollGenerated] = useState(false);
  const [payrollTab, setPayrollTab] = useState<"payroll" | "logs">("payroll");
  const [payrollPage, setPayrollPage] = useState(1);
  const [payrollSiteFilter, setPayrollSiteFilter] = useState("ALL");
  const [payrollNameFilter, setPayrollNameFilter] = useState("");
  const [payrollDateFilter, setPayrollDateFilter] = useState("");
  const [payrollSort, setPayrollSort] = useState<Step2Sort>("name-asc");
  const [showPayrollRateModal, setShowPayrollRateModal] = useState(false);
  const [payrollRateDraft, setPayrollRateDraft] = useState<
    Record<RoleCode, number>
  >(DEFAULT_DAILY_RATE_BY_ROLE);
  const [editingPayrollRowId, setEditingPayrollRowId] = useState<string | null>(
    null,
  );
  const [payrollEditDraft, setPayrollEditDraft] =
    useState<PayrollEditDraft | null>(null);
  const [payrollOverrides, setPayrollOverrides] = useState<
    Record<string, PayrollRowOverride>
  >({});
  const [payrollRoleFilter, setPayrollRoleFilter] = useState<RoleCode | "ALL">(
    "ALL",
  );
  const [logHourOverrides, setLogHourOverrides] = useState<Record<string, number>>({});
  const [payrollSaveNotice, setPayrollSaveNotice] = useState<string | null>(null);
  const [paidHolidays, setPaidHolidays] = useState<PaidHolidayItem[]>([]);

  const persistedLogHourOverrides = useMemo(() => {
    const merged: Record<string, number> = {};

    for (const override of Object.values(payrollOverrides)) {
      if (!override.logHours) continue;

      for (const [key, value] of Object.entries(override.logHours)) {
        if (
          !Number.isFinite(value) ||
          value < 0 ||
          value > MAX_LOG_HOURS_PER_DAY
        ) {
          continue;
        }
        merged[key] = round2(value);
      }
    }

    return merged;
  }, [payrollOverrides]);

  const payrollAttendanceInputs = useMemo(() => {
    return dailyRows
      .map((row) => {
        const identity = parsePayrollIdentity(row.employee);
        const key = getLogOverrideKey(row);
        const overrideHours = persistedLogHourOverrides[key];

        return {
          name: identity.name,
          role: identity.role,
          site: row.site,
          date: row.date,
          hours:
            Number.isFinite(overrideHours) && overrideHours >= 0
              ? overrideHours
              : row.hours,
        };
      })
      .filter(
        (record) =>
          record.name.length > 0 &&
          Number.isFinite(record.hours) &&
          record.hours >= 0,
      );
  }, [dailyRows, persistedLogHourOverrides]);
  const dailyHoursByWorker = useMemo(
    () => buildDailyHoursByWorker(payrollAttendanceInputs),
    [payrollAttendanceInputs],
  );
  const workerDateSpanByKey = useMemo(
    () => buildWorkerDateSpanByKey(payrollAttendanceInputs),
    [payrollAttendanceInputs],
  );

  const payrollBaseRows = useMemo(
    () =>
      buildPayrollBaseRows(
        payrollAttendanceInputs,
        payrollRoleRates,
        attendancePeriod,
      ),
    [payrollAttendanceInputs, payrollRoleRates, attendancePeriod],
  );

  const payrollBaseComputedRows = useMemo(
    () => buildPayrollRows(payrollBaseRows, payrollOverrides, attendancePeriod),
    [payrollBaseRows, payrollOverrides, attendancePeriod],
  );

  const payrollDateRange = useMemo<PayrollDateRange | null>(() => {
    const normalizedPeriod = normalizePeriodLabel(attendancePeriod);
    const parsedAttendanceRange = normalizedPeriod
      ? extractIsoPayrollRange(normalizedPeriod)
      : null;

    if (parsedAttendanceRange) {
      const parsedYear = Number.parseInt(parsedAttendanceRange.start.slice(0, 4), 10);
      return {
        start: parsedAttendanceRange.start,
        end: parsedAttendanceRange.end,
        year: Number.isFinite(parsedYear)
          ? parsedYear
          : new Date().getFullYear(),
      };
    }

    let earliestStart: string | null = null;
    let latestEnd: string | null = null;

    for (const row of payrollBaseComputedRows) {
      const parsedRange = extractIsoPayrollRange(row.date);
      if (!parsedRange) continue;

      if (!earliestStart || parsedRange.start < earliestStart) {
        earliestStart = parsedRange.start;
      }
      if (!latestEnd || parsedRange.end > latestEnd) {
        latestEnd = parsedRange.end;
      }
    }

    if (!earliestStart || !latestEnd) return null;

    const parsedYear = Number.parseInt(earliestStart.slice(0, 4), 10);
    return {
      start: earliestStart,
      end: latestEnd,
      year: Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear(),
    };
  }, [attendancePeriod, payrollBaseComputedRows]);

  const payableHolidayDays = useMemo(() => {
    if (!payrollDateRange || paidHolidays.length === 0) return 0;

    return paidHolidays.filter((holiday) =>
      isIsoDateWithinRange(
        holiday.date,
        payrollDateRange.start,
        payrollDateRange.end,
      ),
    ).length;
  }, [paidHolidays, payrollDateRange]);
  const payableHolidayDates = useMemo(() => {
    if (!payrollDateRange || paidHolidays.length === 0) return [];
    return paidHolidays
      .filter((holiday) =>
        isIsoDateWithinRange(
          holiday.date,
          payrollDateRange.start,
          payrollDateRange.end,
        ),
      )
      .map((holiday) => holiday.date);
  }, [paidHolidays, payrollDateRange]);
  const payableHolidayDateSet = useMemo(
    () => new Set(payableHolidayDates),
    [payableHolidayDates],
  );

  const editingPayrollAdjustments = useMemo<PayrollAdjustmentSet>(() => {
    if (!editingPayrollRowId) return EMPTY_ADJUSTMENTS;

    const override = payrollOverrides[editingPayrollRowId];
    return {
      cashAdvanceEntries: override?.cashAdvanceEntries ?? [],
      overtimeEntries: override?.overtimeEntries ?? [],
      paidLeaveEntries: override?.paidLeaveEntries ?? [],
    };
  }, [editingPayrollRowId, payrollOverrides]);

  const payrollRows = useMemo(
    () =>
      payrollBaseComputedRows.map((row) => {
        const override = payrollOverrides[row.id];
        const rowDailyHours = dailyHoursByWorker.get(row.id) ?? new Map<string, number>();
        const workerDateSpan = workerDateSpanByKey.get(row.id) ?? null;
        const holidayBonusDays = workerDateSpan
          ? countHolidayBonusDays(
              rowDailyHours,
              payableHolidayDateSet,
              workerDateSpan,
            )
          : 0;
        const basePay = computeBasePay(row.hoursWorked);
        const holidayPay = round2(holidayBonusDays * FIXED_PAY_RATE_PER_DAY);
        const leavePay =
          Number.isFinite(override?.paidLeaveEntriesPayTotal)
            ? round2(override?.paidLeaveEntriesPayTotal ?? 0)
            : sumPaidLeavePay(override?.paidLeaveEntries);
        const manualOvertimePay =
          Number.isFinite(override?.overtimeEntriesPayTotal)
            ? round2(override?.overtimeEntriesPayTotal ?? 0)
            : sumOvertimePay(override?.overtimeEntries);
        const manualOvertimeHours =
          Number.isFinite(override?.overtimeEntriesHoursTotal)
            ? round2(override?.overtimeEntriesHoursTotal ?? 0)
            : sumOvertimeHours(override?.overtimeEntries);
        const cashAdvance =
          Number.isFinite(override?.cashAdvanceTotal)
            ? round2(override?.cashAdvanceTotal ?? 0)
            : sumCashAdvance(override?.cashAdvanceEntries);
        const fixedHourlyRate = round2(FIXED_PAY_RATE_PER_DAY / FULL_WORKDAY_HOURS);
        const regularPay = round2(basePay + holidayPay + leavePay);
        const overtimePay = round2(manualOvertimePay);
        const overtimeHours = round2(manualOvertimeHours);
        const totalPay = round2(Math.max(0, regularPay + overtimePay - cashAdvance));

        return {
          ...row,
          defaultRate: fixedHourlyRate,
          rate: fixedHourlyRate,
          customRate: null,
          overtimeHours,
          regularPay,
          overtimePay,
          totalPay,
        };
      }),
    [
      payrollBaseComputedRows,
      payrollOverrides,
      dailyHoursByWorker,
      workerDateSpanByKey,
      payableHolidayDateSet,
    ],
  );

  const filteredPayrollRows = useMemo(
    () =>
      filterPayrollRows(payrollRows, {
        siteFilter: payrollSiteFilter,
        roleFilter: payrollRoleFilter,
        nameFilter: payrollNameFilter,
        dateFilter: payrollDateFilter,
        sort: payrollSort,
      }),
    [
      payrollRows,
      payrollSiteFilter,
      payrollRoleFilter,
      payrollNameFilter,
      payrollDateFilter,
      payrollSort,
    ],
  );

  const filteredPayrollLogs = useMemo(
    () =>
      filterPayrollLogs(payrollAttendanceInputs, {
        siteFilter: payrollSiteFilter,
        roleFilter: payrollRoleFilter,
        nameFilter: payrollNameFilter,
        dateFilter: payrollDateFilter,
        sort: payrollSort,
      }),
    [
      payrollAttendanceInputs,
      payrollSiteFilter,
      payrollRoleFilter,
      payrollNameFilter,
      payrollDateFilter,
      payrollSort,
    ],
  );

  const payrollActiveRowsCount =
    payrollTab === "payroll"
      ? filteredPayrollRows.length
      : filteredPayrollLogs.length;

  const payrollTotalPages = useMemo(
    () => Math.max(1, Math.ceil(payrollActiveRowsCount / PREVIEW_LIMIT)),
    [payrollActiveRowsCount],
  );

  const payrollPreviewStart = (payrollPage - 1) * PREVIEW_LIMIT;
  const payrollPreviewEnd = payrollPreviewStart + PREVIEW_LIMIT;

  const payrollPreviewRows = useMemo(
    () => filteredPayrollRows.slice(payrollPreviewStart, payrollPreviewEnd),
    [filteredPayrollRows, payrollPreviewStart, payrollPreviewEnd],
  );

  const payrollPreviewLogs = useMemo(
    () => filteredPayrollLogs.slice(payrollPreviewStart, payrollPreviewEnd),
    [filteredPayrollLogs, payrollPreviewStart, payrollPreviewEnd],
  );

  const payrollTotals = useMemo(
    () => summarizePayrollTotals(filteredPayrollRows),
    [filteredPayrollRows],
  );

  const editingPayrollRow = useMemo(
    () => payrollBaseComputedRows.find((row) => row.id === editingPayrollRowId) ?? null,
    [payrollBaseComputedRows, editingPayrollRowId],
  );

  const editingPayrollLogs = useMemo(
    () => buildEditingPayrollLogs(dailyRows, editingPayrollRow, attendancePeriod),
    [dailyRows, editingPayrollRow, attendancePeriod],
  );

  const editingPayrollSummary = useMemo(
    () => buildEditingPayrollSummary(editingPayrollLogs, editingPayrollRow),
    [editingPayrollLogs, editingPayrollRow],
  );

  const editingPayrollLogsForAnalytics = useMemo(
    () =>
      applyLogHourOverrides(editingPayrollLogs, logHourOverrides, getLogOverrideKey),
    [editingPayrollLogs, logHourOverrides],
  );

  const hasLogHourOverrides = useMemo(
    () => hasAnyLogHourOverrides(logHourOverrides),
    [logHourOverrides],
  );

  const totalEditedLogHours = useMemo(
    () => calculateTotalEditedLogHours(editingPayrollLogsForAnalytics),
    [editingPayrollLogsForAnalytics],
  );

  const employeeDailyHoursTrend = useMemo(
    () => buildEmployeeDailyHoursTrend(editingPayrollLogsForAnalytics),
    [editingPayrollLogsForAnalytics],
  );

  const employeeAttendanceBreakdown = useMemo(
    () => buildEmployeeAttendanceBreakdown(editingPayrollLogsForAnalytics),
    [editingPayrollLogsForAnalytics],
  );

  const employeeClockInConsistency = useMemo(
    () => buildEmployeeClockInConsistency(editingPayrollLogsForAnalytics),
    [editingPayrollLogsForAnalytics],
  );

  const payrollEditPreview = useMemo(
    () =>
      buildPayrollEditPreview(
        editingPayrollRow,
        payrollEditDraft,
        hasLogHourOverrides,
        totalEditedLogHours,
      ),
    [editingPayrollRow, payrollEditDraft, hasLogHourOverrides, totalEditedLogHours],
  );

  const payrollPages = useMemo(
    () => buildVisiblePages(payrollPage, payrollTotalPages),
    [payrollPage, payrollTotalPages],
  );

  useEffect(() => {
    setPayrollPage((prev) => Math.min(prev, payrollTotalPages));
  }, [payrollTotalPages]);

  useEffect(() => {
    setPayrollPage(1);
  }, [
    payrollTab,
    payrollSiteFilter,
    payrollNameFilter,
    payrollDateFilter,
    payrollSort,
  ]);

  useEffect(() => {
    if (!payrollEditDraft || !editingPayrollRowId || !hasLogHourOverrides) {
      return;
    }

    const nextHoursText = String(totalEditedLogHours);
    if (payrollEditDraft.hoursWorked === nextHoursText) return;

    setPayrollEditDraft((prev) =>
      prev ? { ...prev, hoursWorked: nextHoursText } : prev,
    );
  }, [
    payrollEditDraft,
    editingPayrollRowId,
    hasLogHourOverrides,
    totalEditedLogHours,
  ]);

  useEffect(() => {
    if (payrollSiteFilter !== "ALL" && !availableSites.includes(payrollSiteFilter)) {
      setPayrollSiteFilter("ALL");
    }
  }, [availableSites, payrollSiteFilter]);

  useEffect(() => {
    const validIds = new Set(payrollBaseRows.map((row) => row.id));
    setPayrollOverrides((prev) => {
      const next = Object.fromEntries(
        Object.entries(prev).filter(([id]) => validIds.has(id)),
      );

      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }, [payrollBaseRows]);

  function clearPayrollFilters() {
    setPayrollSiteFilter("ALL");
    setPayrollNameFilter("");
    setPayrollDateFilter("");
    setPayrollSort("name-asc");
    setPayrollRoleFilter("ALL");
  }

  function resetPayrollState() {
    setPayrollRoleRates(DEFAULT_DAILY_RATE_BY_ROLE);
    setPayrollGenerated(false);
    setPayrollTab("payroll");
    setPayrollPage(1);
    setPayrollSiteFilter("ALL");
    setPayrollNameFilter("");
    setPayrollDateFilter("");
    setPayrollSort("name-asc");
    setShowPayrollRateModal(false);
    setPayrollRateDraft(DEFAULT_DAILY_RATE_BY_ROLE);
    setEditingPayrollRowId(null);
    setPayrollEditDraft(null);
    setPayrollOverrides({});
    setPayrollRoleFilter("ALL");
    setLogHourOverrides({});
    setPayrollSaveNotice(null);
    setPaidHolidays([]);
    document.body.style.overflow = "auto";
  }

  function handleGeneratePayroll(): boolean {
    if (payrollRows.length === 0) return false;

    setPayrollSaveNotice(null);
    setPayrollGenerated(true);
    setPayrollTab("payroll");
    setPayrollPage(1);
    setPayrollSiteFilter("ALL");
    setPayrollNameFilter("");
    setPayrollDateFilter("");
    setPayrollSort("name-asc");

    return true;
  }

  function handleExportPayroll() {
    if (filteredPayrollRows.length === 0) return;
    exportPayrollToExcel(filteredPayrollRows);
  }

  function openPayrollRateModal() {
    setPayrollRateDraft({ ...payrollRoleRates });
    setShowPayrollRateModal(true);
    document.body.style.overflow = "hidden";
  }

  function closePayrollRateModal() {
    setShowPayrollRateModal(false);
    document.body.style.overflow = "auto";
  }

  function applyPayrollRates() {
    setPayrollRoleRates({ ...payrollRateDraft });
    setShowPayrollRateModal(false);
    document.body.style.overflow = "auto";
  }

  function addManualPaidHoliday(date: string, name: string) {
    const normalizedDate = date.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) return;

    const label = name.trim() || "Manual Holiday";
    setPaidHolidays((prev) =>
      mergeHolidayItems(prev, [
        {
          date: normalizedDate,
          name: label,
          source: "manual",
        },
      ]),
    );
  }

  function removePaidHoliday(date: string) {
    const normalizedDate = date.trim();
    setPaidHolidays((prev) =>
      prev.filter((holiday) => holiday.date !== normalizedDate),
    );
  }

  function clearPaidHolidays() {
    setPaidHolidays([]);
  }

  function loadPhilippinePaidHolidays() {
    if (!payrollDateRange) {
      toast.error("Unable to load holidays", {
        description: "Payroll period is not available yet.",
      });
      return;
    }

    const startYear = Number.parseInt(payrollDateRange.start.slice(0, 4), 10);
    const endYear = Number.parseInt(payrollDateRange.end.slice(0, 4), 10);

    if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return;

    const fromYear = Math.min(startYear, endYear);
    const toYear = Math.max(startYear, endYear);
    const years = Array.from(
      { length: toYear - fromYear + 1 },
      (_value, index) => fromYear + index,
    );

    const generated = years.flatMap((year) => getPhilippineHolidaysByYear(year));

    const inRange = generated.filter((holiday) =>
      isIsoDateWithinRange(
        holiday.date,
        payrollDateRange.start,
        payrollDateRange.end,
      ),
    );

    if (inRange.length === 0) {
      toast.info("No PH holidays in this payroll range", {
        description: `${fromYear} to ${toYear} generated 0 holiday(s) inside ${payrollDateRange.start} to ${payrollDateRange.end}.`,
      });
      return;
    }

    setPaidHolidays((prev) => mergeHolidayItems(prev, inRange));

    toast.success("Philippine holidays loaded", {
      description: `${inRange.length} holiday(s) merged for ${payrollDateRange.start} to ${payrollDateRange.end}.`,
    });
  }

  function openPayrollEditModal(row: PayrollRow) {
    const existingOverride = payrollOverrides[row.id];
    const baseRow =
      payrollBaseComputedRows.find((candidate) => candidate.id === row.id) ?? row;
    const normalizedPeriod = normalizePeriodLabel(attendancePeriod);

    setPayrollSaveNotice(null);
    setEditingPayrollRowId(row.id);
    const sanitizedLogHours = Object.fromEntries(
      Object.entries(existingOverride?.logHours ?? {})
        .filter(([, value]) => Number.isFinite(value))
        .map(([key, value]) => [
          key,
          Math.round(
            Math.max(0, Math.min(Number(value), MAX_LOG_HOURS_PER_DAY)) * 100,
          ) / 100,
        ]),
    );
    setLogHourOverrides(sanitizedLogHours);
    setPayrollEditDraft({
      date: normalizedPeriod ?? baseRow.date,
      hoursWorked: String(existingOverride?.hoursWorked ?? baseRow.hoursWorked),
      rate:
        (existingOverride?.customRate ?? baseRow.customRate) === null
          ? ""
          : String(existingOverride?.customRate ?? baseRow.customRate),
      overtimeHours: String(existingOverride?.overtimeHours ?? baseRow.overtimeHours),
    });

    document.body.style.overflow = "hidden";
  }

  function closePayrollEditModal() {
    setEditingPayrollRowId(null);
    setPayrollEditDraft(null);
    setLogHourOverrides({});
    document.body.style.overflow = "auto";
  }

  function savePayrollEdit(adjustments?: PayrollAdjustmentSet) {
    if (!editingPayrollRow || !payrollEditDraft) return;
    const existingOverride = payrollOverrides[editingPayrollRow.id];

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

    const nextLogHours =
      hasLogHourOverrides && editingPayrollLogs.length > 0
        ? Object.fromEntries(
            editingPayrollLogs
              .map((log) => {
              const key = getLogOverrideKey(log);
              const value = logHourOverrides[key] ?? log.hours;
              const normalized =
                Number.isFinite(value) && value >= 0
                  ? Math.round(Math.min(value, MAX_LOG_HOURS_PER_DAY) * 100) / 100
                  : 0;
              const baseValue = Math.round(Math.max(0, log.hours) * 100) / 100;
              return [key, normalized, baseValue] as const;
            })
              .filter(([, normalized, baseValue]) =>
                Math.abs(normalized - baseValue) > 0.001,
              )
              .map(([key, normalized]) => [key, normalized]),
          )
        : undefined;

    const normalizedPeriod = normalizePeriodLabel(attendancePeriod);
    const nextCashAdvanceEntries = sanitizeCashAdvanceEntries(
      adjustments?.cashAdvanceEntries ?? existingOverride?.cashAdvanceEntries,
    );
    const nextOvertimeEntries = sanitizeOvertimeEntries(
      adjustments?.overtimeEntries ?? existingOverride?.overtimeEntries,
    );
    const nextPaidLeaveEntries = sanitizePaidLeaveEntries(
      adjustments?.paidLeaveEntries ?? existingOverride?.paidLeaveEntries,
    );
    const nextCashAdvanceTotal = sumCashAdvance(nextCashAdvanceEntries);
    const nextOvertimeEntriesPayTotal = sumOvertimePay(nextOvertimeEntries);
    const nextOvertimeEntriesHoursTotal = sumOvertimeHours(nextOvertimeEntries);
    const nextPaidLeaveEntriesPayTotal = sumPaidLeavePay(nextPaidLeaveEntries);

    setPayrollOverrides((prev) => ({
      ...prev,
      [editingPayrollRow.id]: {
        date: normalizedPeriod ?? payrollEditDraft.date.trim(),
        hoursWorked: nextHours,
        overtimeHours: nextOvertime,
        customRate: nextCustomRate,
        logHours: nextLogHours,
        cashAdvanceEntries: nextCashAdvanceEntries,
        overtimeEntries: nextOvertimeEntries,
        paidLeaveEntries: nextPaidLeaveEntries,
        cashAdvanceTotal: nextCashAdvanceTotal,
        overtimeEntriesPayTotal: nextOvertimeEntriesPayTotal,
        overtimeEntriesHoursTotal: nextOvertimeEntriesHoursTotal,
        paidLeaveEntriesPayTotal: nextPaidLeaveEntriesPayTotal,
      },
    }));

    setPayrollSaveNotice(
      `Saved ${editingPayrollRow.worker}: ${nextHours.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} hours`,
    );
    toast.success("Payroll edit saved", {
      description: `${editingPayrollRow.worker} updated successfully.`,
    });

    closePayrollEditModal();
  }
  function updateLogHour(log: DailyLogRow, valueText: string) {
    const normalized = normalizeNumericInput(valueText);
    const value = Number.parseFloat(normalized);

    setLogHourOverrides((prev) => ({
      ...prev,
      [getLogOverrideKey(log)]:
        Number.isFinite(value) && value >= 0
          ? Math.round(Math.min(value, MAX_LOG_HOURS_PER_DAY) * 100) / 100
          : 0,
    }));
  }

  return {
    payrollRoleRates,
    setPayrollRoleRates,
    payrollGenerated,
    setPayrollGenerated,
    payrollTab,
    setPayrollTab,
    payrollPage,
    setPayrollPage,
    payrollSiteFilter,
    setPayrollSiteFilter,
    payrollNameFilter,
    setPayrollNameFilter,
    payrollDateFilter,
    setPayrollDateFilter,
    payrollSort,
    setPayrollSort,
    payrollRoleFilter,
    setPayrollRoleFilter,
    payrollSaveNotice,
    showPayrollRateModal,
    payrollRateDraft,
    setPayrollRateDraft,
    payrollAttendanceInputs,
    payrollOverrides,
    setPayrollOverrides,
    payrollRows,
    payrollBaseComputedRows,
    filteredPayrollRows,
    filteredPayrollLogs,
    paidHolidays,
    setPaidHolidays,
    payrollDateRange,
    payableHolidayDays,
    payrollActiveRowsCount,
    payrollTotalPages,
    payrollPreviewStart,
    payrollPreviewEnd,
    payrollPreviewRows,
    payrollPreviewLogs,
    payrollTotals,
    payrollPages,
    editingPayrollRow,
    editingPayrollLogs,
    editingPayrollSummary,
    editingPayrollAdjustments,
    editingPayrollLogsForAnalytics,
    payrollEditDraft,
    setPayrollEditDraft,
    payrollEditPreview,
    logHourOverrides,
    setLogHourOverrides,
    hasLogHourOverrides,
    totalEditedLogHours,
    employeeDailyHoursTrend,
    employeeAttendanceBreakdown,
    employeeClockInConsistency,
    clearPayrollFilters,
    resetPayrollState,
    handleGeneratePayroll,
    handleExportPayroll,
    openPayrollRateModal,
    closePayrollRateModal,
    applyPayrollRates,
    addManualPaidHoliday,
    removePaidHoliday,
    clearPaidHolidays,
    loadPhilippinePaidHolidays,
    openPayrollEditModal,
    closePayrollEditModal,
    savePayrollEdit,
    updateLogHour,
    normalizeNumericInput,
    roleCodes: ROLE_CODES,
  };
}

