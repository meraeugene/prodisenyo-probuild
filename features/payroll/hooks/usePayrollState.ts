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
import { normalizePeriodLabel } from "@/features/payroll/utils/payrollDateHelpers";
import { getLogOverrideKey } from "@/features/payroll/utils/payrollMappers";
import {
  applyLogHourOverrides,
  buildEditingPayrollLogs,
  buildEditingPayrollSummary,
  buildEmployeeAttendanceBreakdown,
  buildEmployeeClockInConsistency,
  buildEmployeeDailyHoursTrend,
  buildPayrollBaseRows,
  buildPayrollEditPreview,
  buildPayrollRows,
  calculateTotalEditedLogHours,
  filterPayrollLogs,
  filterPayrollRows,
  hasAnyLogHourOverrides,
  mapDailyRowsToAttendanceInputs,
  summarizePayrollTotals,
} from "@/features/payroll/utils/payrollSelectors";
import type {
  PaidHolidayItem,
  PayrollDateRange,
  PayrollEditDraft,
  PayrollRowOverride,
} from "@/features/payroll/types";

const PREVIEW_LIMIT = 10;
const HOURS_PER_WORKDAY = 8;
const FIXED_RATE_PER_DAY = 500;

function extractIsoPayrollRange(value: string): { start: string; end: string } | null {
  const normalized = value.trim();
  if (!normalized) return null;

  const isoRange = normalized.match(
    /(\d{4}-\d{2}-\d{2})\s*to\s*(\d{4}-\d{2}-\d{2})/i,
  );
  if (isoRange) {
    return { start: isoRange[1], end: isoRange[2] };
  }

  const singleIso = normalized.match(/(\d{4}-\d{2}-\d{2})/);
  if (singleIso) {
    return { start: singleIso[1], end: singleIso[1] };
  }

  return null;
}

function isWithinRange(
  value: string,
  rangeStart: string | null,
  rangeEnd: string | null,
): boolean {
  if (!rangeStart || !rangeEnd) return true;
  return value >= rangeStart && value <= rangeEnd;
}

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

function computeWorkedDays(totalHours: number): number {
  if (!Number.isFinite(totalHours) || totalHours <= 0) return 0;
  return Math.floor(totalHours / HOURS_PER_WORKDAY);
}

function computeHolidayAdjustedTotalPay(
  totalHours: number,
  holidayBonusDays: number,
): number {
  const workedDays = computeWorkedDays(totalHours);
  const extraHolidayDays = Math.max(0, holidayBonusDays);
  const payableDays = workedDays + extraHolidayDays;

  if (payableDays <= 0) return 0;
  return Number((payableDays * FIXED_RATE_PER_DAY).toFixed(2));
}

export interface UsePayrollStateArgs {
  dailyRows: DailyLogRow[];
  attendancePeriod: string;
  availableSites: string[];
}

export interface UsePayrollStateResult {
  payrollRoleRates: Record<RoleCode, number>;
  payrollGenerated: boolean;
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
  payrollRows: PayrollRow[];
  payrollBaseComputedRows: PayrollRow[];
  filteredPayrollRows: PayrollRow[];
  filteredPayrollLogs: AttendanceRecordInput[];
  paidHolidays: PaidHolidayItem[];
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
  savePayrollEdit: () => void;
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
  const [payrollSort, setPayrollSort] = useState<Step2Sort>("date-asc");
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

  const payrollAttendanceInputs = useMemo(
    () => mapDailyRowsToAttendanceInputs(dailyRows),
    [dailyRows],
  );
  const dailyHoursByWorker = useMemo(
    () => buildDailyHoursByWorker(payrollAttendanceInputs),
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
  }, [payrollBaseComputedRows]);

  const payableHolidayDays = useMemo(() => {
    if (!payrollDateRange || paidHolidays.length === 0) return 0;

    return paidHolidays.filter((holiday) =>
      isWithinRange(holiday.date, payrollDateRange.start, payrollDateRange.end),
    ).length;
  }, [paidHolidays, payrollDateRange]);
  const payableHolidayDates = useMemo(() => {
    if (!payrollDateRange || paidHolidays.length === 0) return [];
    return paidHolidays
      .filter((holiday) =>
        isWithinRange(holiday.date, payrollDateRange.start, payrollDateRange.end),
      )
      .map((holiday) => holiday.date);
  }, [paidHolidays, payrollDateRange]);

  const payrollRows = useMemo(
    () =>
      payrollBaseComputedRows.map((row) => {
        const rowDailyHours = dailyHoursByWorker.get(row.id);
        const holidayBonusDays = payableHolidayDates.reduce((count, holidayDate) => {
          const loggedHours = rowDailyHours?.get(holidayDate) ?? 0;
          return loggedHours < HOURS_PER_WORKDAY ? count + 1 : count;
        }, 0);
        const totalPay = computeHolidayAdjustedTotalPay(
          row.hoursWorked,
          holidayBonusDays,
        );

        return {
          ...row,
          rate: FIXED_RATE_PER_DAY,
          regularPay: totalPay,
          overtimePay: 0,
          totalPay,
        };
      }),
    [payrollBaseComputedRows, dailyHoursByWorker, payableHolidayDates],
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
    setPayrollSort("date-asc");
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
    setPayrollSort("date-asc");
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
    setPayrollSort("date-asc");

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

    const generated = years
      .flatMap((year) => getPhilippineHolidaysByYear(year));

    const inRange = generated.filter((holiday) =>
      isWithinRange(
        holiday.date,
        payrollDateRange.start,
        payrollDateRange.end,
      ),
    );

    const toAdd = inRange.length > 0 ? inRange : generated;
    setPaidHolidays((prev) => mergeHolidayItems(prev, toAdd));

    if (inRange.length > 0) {
      toast.success("Philippine holidays loaded", {
        description: `${inRange.length} holiday(s) added for this payroll period.`,
      });
      return;
    }

    toast.info("No PH holidays in this payroll range", {
      description: `Loaded ${generated.length} holiday(s) for ${fromYear} to ${toYear} so you can select from the calendar.`,
    });
  }

  function openPayrollEditModal(row: PayrollRow) {
    const existingOverride = payrollOverrides[row.id];
    const normalizedPeriod = normalizePeriodLabel(attendancePeriod);

    setPayrollSaveNotice(null);
    setEditingPayrollRowId(row.id);
    setLogHourOverrides(existingOverride?.logHours ?? {});
    setPayrollEditDraft({
      date: normalizedPeriod ?? row.date,
      hoursWorked: String(row.hoursWorked),
      rate: row.customRate === null ? "" : String(row.customRate),
      overtimeHours: String(row.overtimeHours),
    });

    document.body.style.overflow = "hidden";
  }

  function closePayrollEditModal() {
    setEditingPayrollRowId(null);
    setPayrollEditDraft(null);
    setLogHourOverrides({});
    document.body.style.overflow = "auto";
  }

  function savePayrollEdit() {
    if (!editingPayrollRow || !payrollEditDraft) return;

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
            editingPayrollLogs.map((log) => {
              const key = getLogOverrideKey(log);
              const value = logHourOverrides[key] ?? log.hours;
              const normalized =
                Number.isFinite(value) && value >= 0
                  ? Math.round(value * 100) / 100
                  : 0;
              return [key, normalized];
            }),
          )
        : undefined;

    const normalizedPeriod = normalizePeriodLabel(attendancePeriod);

    setPayrollOverrides((prev) => ({
      ...prev,
      [editingPayrollRow.id]: {
        date: normalizedPeriod ?? payrollEditDraft.date.trim(),
        hoursWorked: nextHours,
        overtimeHours: nextOvertime,
        customRate: nextCustomRate,
        logHours: nextLogHours,
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
        Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : 0,
    }));
  }

  return {
    payrollRoleRates,
    payrollGenerated,
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
    payrollRows,
    payrollBaseComputedRows,
    filteredPayrollRows,
    filteredPayrollLogs,
    paidHolidays,
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

