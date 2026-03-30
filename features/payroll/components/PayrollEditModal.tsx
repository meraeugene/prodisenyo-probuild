"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { toast } from "sonner";
import { requestOvertimeApprovalAction } from "@/actions/payroll";
import { useAppState } from "@/features/app/AppStateProvider";
import { ROLE_CODE_TO_NAME, type RoleCode } from "@/lib/payrollConfig";
import type { DailyLogRow } from "@/types";
import type { UsePayrollStateResult } from "@/features/payroll/hooks/usePayrollState";
import type {
  PayrollCashAdvanceEntry,
  PayrollOvertimeEntry,
  PayrollPaidLeaveEntry,
} from "@/features/payroll/types";
import {
  extractSiteName,
  formatLogTime,
  formatPayrollPeriodFromText,
  formatPayrollNumber,
  normalizeNumericInput,
  toWeekLabel,
} from "@/features/payroll/utils/payrollFormatters";
import {
  buildEmployeeBranchRateKey,
  getLogOverrideKey,
} from "@/features/payroll/utils/payrollMappers";
import { computeSameDayOvertimeMinutes } from "@/lib/utils";
import {
  allocateCombinedBranchPay,
  computeDaysWorked,
  FIXED_PAY_RATE_PER_DAY,
  FULL_WORKDAY_HOURS,
} from "@/features/payroll/utils/payrollSelectors";

const EMPLOYEE_ANALYTICS_COLORS = [
  "#15803d",
  "#f97316",
  "#dc2626",
  "#2563eb",
  "#a855f7",
];

const DAILY_HOURS_LINE_COLOR = "#15803d";
const DAILY_HOURS_AREA_COLOR = "#22c55e";
const DAILY_HOURS_GRID_COLOR = "#bbf7d0";
const CLOCK_IN_BAR_TOP_COLOR = "#15803d";
const CLOCK_IN_BAR_BOTTOM_COLOR = "#4ade80";
const CLOCK_IN_GRID_COLOR = "#d1fae5";
const OVERTIME_ALERT_HOURS = 10;
type AdjustmentFormType = "cashAdvance" | "overtime" | "paidLeave" | null;

function parseNonNegativeValue(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function isExpandedPlaceholderLog(log: DailyLogRow): boolean {
  return (
    log.site.trim() === "" &&
    !log.time1In &&
    !log.time1Out &&
    !log.time2In &&
    !log.time2Out &&
    !log.otIn &&
    !log.otOut
  );
}

function createEntryId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function formatPeso(value: number): string {
  return `\u20B1${formatPayrollNumber(value)}`;
}

function getAttendanceBreakdownColor(name: string, index: number): string {
  const key = name.trim().toLowerCase();
  if (key.includes("attendance")) return "#15803d";
  if (key.includes("leave")) return "#f97316";
  if (key.includes("absence")) return "#dc2626";
  if (key.includes("business trip")) return "#2563eb";
  return EMPLOYEE_ANALYTICS_COLORS[index % EMPLOYEE_ANALYTICS_COLORS.length];
}

function chartTickFormatter(value: string): string {
  if (!value) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.slice(5) : value;
}

function AnalyticsTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: TooltipProps<number, string> & {
  valueFormatter?: (value: number, name: string, item: any) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="min-w-[148px] rounded-xl border border-apple-mist bg-white px-3 py-2 shadow-[0_10px_28px_rgba(2,6,23,0.08)]">
      {label ? (
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-apple-smoke">
          {label}
        </p>
      ) : null}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const numericValue =
            typeof entry.value === "number"
              ? entry.value
              : Number(entry.value ?? 0);
          const name = String(entry.name ?? entry.dataKey ?? "Value");

          return (
            <div key={`${name}-${index}`} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: entry.color ?? "rgb(var(--theme-chart-2))",
                }}
              />
              <span className="text-[11px] text-apple-smoke">{name}</span>
              <span className="ml-auto text-[12px] font-semibold text-apple-charcoal">
                {valueFormatter
                  ? valueFormatter(numericValue, name, entry.payload)
                  : formatPayrollNumber(numericValue)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PayrollEditModalProps {
  payroll: UsePayrollStateResult;
}

export default function PayrollEditModal({ payroll }: PayrollEditModalProps) {
  const { currentAttendanceImportId, attendancePeriod } = useAppState();
  const { editingPayrollRow, editingPayrollSourceRow, payrollEditDraft } = payroll;

  const [activeAdjustmentForm, setActiveAdjustmentForm] =
    useState<AdjustmentFormType>(null);
  const [cashAdvanceInput, setCashAdvanceInput] = useState("");
  const [cashAdvanceNotes, setCashAdvanceNotes] = useState("");
  const [overtimeHoursInput, setOvertimeHoursInput] = useState("");
  const [overtimePayInput, setOvertimePayInput] = useState("");
  const [overtimeNotes, setOvertimeNotes] = useState("");
  const [paidLeaveDaysInput, setPaidLeaveDaysInput] = useState("");
  const [paidLeaveNotes, setPaidLeaveNotes] = useState("");
  const [cashAdvanceEntries, setCashAdvanceEntries] = useState<
    PayrollCashAdvanceEntry[]
  >([]);
  const [overtimeEntries, setOvertimeEntries] = useState<
    PayrollOvertimeEntry[]
  >([]);
  const [paidLeaveEntries, setPaidLeaveEntries] = useState<
    PayrollPaidLeaveEntry[]
  >([]);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [overtimeValidationMessage, setOvertimeValidationMessage] =
    useState<string | null>(null);

  useEffect(() => {
    setActiveAdjustmentForm(null);
    setCashAdvanceInput("");
    setCashAdvanceNotes("");
    setOvertimeHoursInput("");
    setOvertimePayInput("");
    setOvertimeNotes("");
    setPaidLeaveDaysInput("");
    setPaidLeaveNotes("");
    setCashAdvanceEntries([
      ...payroll.editingPayrollAdjustments.cashAdvanceEntries,
    ]);
    setOvertimeEntries([...payroll.editingPayrollAdjustments.overtimeEntries]);
    setPaidLeaveEntries([
      ...payroll.editingPayrollAdjustments.paidLeaveEntries,
    ]);
  }, [editingPayrollRow?.id, payroll.editingPayrollAdjustments]);

  if (!editingPayrollRow || !payrollEditDraft) return null;

  function getHoursValue(log: DailyLogRow): string {
    const key = getLogOverrideKey(log);
    const value = payroll.logHourOverrides[key] ?? log.hours;
    return normalizeNumericInput(String(value));
  }

  function getHoursNumber(log: DailyLogRow): number {
    const key = getLogOverrideKey(log);
    const value = payroll.logHourOverrides[key] ?? log.hours;
    if (!Number.isFinite(value)) return 0;
    return value;
  }

  const loggedSites = Array.from(
    new Set(
      payroll.editingPayrollLogs
        .map((log) => extractSiteName(log.site))
        .filter((site) => site.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const loggedSitesLabel =
    loggedSites.length > 0
      ? loggedSites.join(", ")
      : extractSiteName(editingPayrollRow.site) || "-";
  const primarySiteSource =
    payroll.editingPayrollLogs.find(
      (log) => extractSiteName(log.site).length > 0,
    )?.site ?? editingPayrollRow.site;
  const primarySitePeriodLabel =
    formatPayrollPeriodFromText(primarySiteSource) ??
    formatPayrollPeriodFromText(editingPayrollRow.date);
  const currentLogsForPay = payroll.editingPayrollLogsForAnalytics;
  const editingDates = new Set(
    payroll.editingPayrollLogs.map((log) => log.date),
  );
  const holidayLogDateSet = new Set(
    payroll.paidHolidays
      .map((holiday) => holiday.date)
      .filter((date) => editingDates.has(date)),
  );
  const totalWorkedHours = round2(
    currentLogsForPay.reduce((sum, log) => sum + log.hours, 0),
  );
  const sitePayBreakdown = loggedSites.map((site) => {
    const siteLogs = currentLogsForPay.filter(
      (log) => extractSiteName(log.site) === site,
    );
    const siteHours = round2(siteLogs.reduce((sum, log) => sum + log.hours, 0));
    const siteRateKey = buildEmployeeBranchRateKey(
      editingPayrollRow.worker,
      editingPayrollRow.role,
      site,
    );
    const siteRatePerDay = round2(
      payroll.employeeBranchRates[siteRateKey] ??
        (editingPayrollRow.customRate ?? editingPayrollRow.defaultRate) *
          FULL_WORKDAY_HOURS,
    );
    return {
      site,
      hours: siteHours,
      ratePerDay: siteRatePerDay,
    };
  });
  const branchPayAllocation = allocateCombinedBranchPay(
    sitePayBreakdown.map((entry) => ({
      site: entry.site,
      hoursWorked: entry.hours,
      dailyRatePerDay: entry.ratePerDay,
    })),
  );
  const sitePayBreakdownWithAllocation = sitePayBreakdown.map((entry) => {
    const allocation =
      branchPayAllocation.breakdown.find((item) => item.site === entry.site) ??
      null;

    return {
      ...entry,
      payableHours: allocation?.payableHours ?? 0,
      payableDays: allocation?.payableDays ?? 0,
      basePay: allocation?.basePay ?? 0,
    };
  });
  const currentRatePerDay = round2(
    sitePayBreakdownWithAllocation[0]?.ratePerDay ??
      (editingPayrollRow.customRate ?? editingPayrollRow.defaultRate) *
        FULL_WORKDAY_HOURS,
  );
  const daysWorked = computeDaysWorked(totalWorkedHours);
  const paidHolidayBonusDays = holidayLogDateSet.size;
  const underHoursLogs = currentLogsForPay.filter(
    (log) =>
      log.hours > 0 &&
      log.hours < FULL_WORKDAY_HOURS &&
      !holidayLogDateSet.has(log.date),
  );
  const highOvertimeHoursLogs = currentLogsForPay.filter(
    (log) =>
      log.hours >= OVERTIME_ALERT_HOURS && !holidayLogDateSet.has(log.date),
  );
  const overtimeLogs = currentLogsForPay.filter(
    (log) =>
      computeSameDayOvertimeMinutes(log.otIn, log.otOut) > 0 &&
      !holidayLogDateSet.has(log.date),
  );
  const hasHoursReviewWarning =
    underHoursLogs.length > 0 || highOvertimeHoursLogs.length > 0;
  const baseWorkedPay =
    sitePayBreakdownWithAllocation.length > 0
      ? branchPayAllocation.totalBasePay
      : 0;
  const paidHolidayPay = round2(
    paidHolidayBonusDays * FIXED_PAY_RATE_PER_DAY,
  );
  const previewTotalPay = baseWorkedPay + paidHolidayPay;
  const belowFullDayThreshold =
    totalWorkedHours > 0 && branchPayAllocation.totalPayableHours === 0;
  const cashAdvanceAmount = cashAdvanceEntries.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );
  const approvedOvertimeEntries = overtimeEntries.filter(
    (entry) => entry.status === "approved",
  );
  const pendingOvertimeEntries = overtimeEntries.filter(
    (entry) => (entry.status ?? "pending") === "pending",
  );
  const rejectedOvertimeEntries = overtimeEntries.filter(
    (entry) => entry.status === "rejected",
  );
  const approvedOvertimePay = approvedOvertimeEntries.reduce(
    (sum, entry) => sum + entry.pay,
    0,
  );
  const approvedOvertimeHours = approvedOvertimeEntries.reduce(
    (sum, entry) => sum + entry.hours,
    0,
  );
  const pendingOvertimePay = pendingOvertimeEntries.reduce(
    (sum, entry) => sum + entry.pay,
    0,
  );
  const pendingOvertimeHours = pendingOvertimeEntries.reduce(
    (sum, entry) => sum + entry.hours,
    0,
  );
  const rejectedOvertimePay = rejectedOvertimeEntries.reduce(
    (sum, entry) => sum + entry.pay,
    0,
  );
  const rejectedOvertimeHours = rejectedOvertimeEntries.reduce(
    (sum, entry) => sum + entry.hours,
    0,
  );
  const paidLeavePay = paidLeaveEntries.reduce(
    (sum, entry) => sum + entry.pay,
    0,
  );
  const adjustedTotalPay = Number(
    (
      previewTotalPay +
      approvedOvertimePay +
      paidLeavePay -
      cashAdvanceAmount
    ).toFixed(2),
  );

  function addCashAdvance() {
    const amount = parseNonNegativeValue(cashAdvanceInput);
    if (amount <= 0) return;

    setCashAdvanceEntries((prev) => [
      ...prev,
      {
        id: createEntryId(),
        amount: Number(amount.toFixed(2)),
        notes: cashAdvanceNotes.trim(),
      },
    ]);
    setCashAdvanceInput("");
    setCashAdvanceNotes("");
    setActiveAdjustmentForm(null);
  }

  function addOvertime() {
    const hours = parseNonNegativeValue(overtimeHoursInput);
    const pay = parseNonNegativeValue(overtimePayInput);
    if (hours <= 0 && pay <= 0) {
      setOvertimeValidationMessage(
        "Add overtime hours or overtime pay before submitting.",
      );
      return;
    }
    if (hours <= 0) {
      setOvertimeValidationMessage("Overtime hours must be greater than 0.");
      return;
    }
    if (pay <= 0) {
      setOvertimeValidationMessage("Overtime pay must be greater than 0.");
      return;
    }

    setOvertimeEntries((prev) => [
      ...prev,
      {
        id: createEntryId(),
        requestId: null,
        hours: Number(hours.toFixed(2)),
        pay: Number(pay.toFixed(2)),
        notes: overtimeNotes.trim(),
        status: "pending",
      },
    ]);
    setOvertimeValidationMessage(null);
    setOvertimeHoursInput("");
    setOvertimePayInput("");
    setOvertimeNotes("");
    setActiveAdjustmentForm(null);
  }

  function addPaidLeave() {
    const days = parseNonNegativeValue(paidLeaveDaysInput);
    if (days <= 0) return;
    const pay = Number((days * currentRatePerDay).toFixed(2));

    setPaidLeaveEntries((prev) => [
      ...prev,
      {
        id: createEntryId(),
        days: Number(days.toFixed(2)),
        pay,
        notes: paidLeaveNotes.trim(),
      },
    ]);
    setPaidLeaveDaysInput("");
    setPaidLeaveNotes("");
    setActiveAdjustmentForm(null);
  }

  function removeCashAdvance(id: string) {
    setCashAdvanceEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  function removeOvertime(id: string) {
    setOvertimeEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  async function handleSaveChanges() {
    if (!editingPayrollRow || isSavingChanges) return;

    setIsSavingChanges(true);
    try {
      const nextPendingEntries = pendingOvertimeEntries.map((entry) => ({
        ...entry,
        status: "pending" as const,
      }));

      const approvedEntries = approvedOvertimeEntries.map((entry) => ({
        ...entry,
        status: "approved" as const,
      }));

      const result = await requestOvertimeApprovalAction({
        attendanceImportId: currentAttendanceImportId,
        employeeName: editingPayrollRow.worker,
        roleCode: editingPayrollRow.role,
        siteName: editingPayrollSourceRow?.site ?? editingPayrollRow.site,
        attendancePeriod,
        overtimeEntries: nextPendingEntries,
      });

      payroll.savePayrollEdit({
        cashAdvanceEntries,
        overtimeEntries: [...approvedEntries, ...result.entries],
        paidLeaveEntries,
      });

      if (result.entries.length > 0) {
        toast.success("Overtime request sent", {
          description:
            "The request is now in the CEO approval queue and will recalculate once approved.",
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to submit overtime request.",
      );
    } finally {
      setIsSavingChanges(false);
    }
  }

  function removePaidLeave(id: string) {
    setPaidLeaveEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-apple-mist bg-white shadow-apple-xs">
        <div className="sticky top-0 z-10 border-b border-apple-mist bg-white px-5 py-4 sm:px-7 flex items-start justify-between gap-3">
          <div>
            <p className="text-2xs font-semibold  uppercase tracking-widest">
              Calculation Details
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {/* Employee */}
              <h3 className="text-lg font-semibold text-apple-charcoal tracking-tight">
                {editingPayrollRow.worker}
              </h3>

              <span className="text-apple-silver">&middot;</span>

              {/* Role */}
              <span className="px-2.5 py-1 rounded-full bg-emerald-700 text-xs font-medium text-white">
                {ROLE_CODE_TO_NAME[editingPayrollRow.role as RoleCode] ??
                  "Unknown Role"}
              </span>

              <span className="text-apple-silver">&middot;</span>

              {/* Site */}
              <span className="text-sm ">{loggedSitesLabel}</span>
              {primarySitePeriodLabel && (
                <>
                  <span className="text-apple-silver">&middot;</span>
                  <span className="text-sm text-emerald-700">
                    {primarySitePeriodLabel}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={payroll.closePayrollEditModal}
            className="w-8 h-8 rounded-full  text-white bg-emerald-800 hover:bg-emerald-900  transition flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6 [scrollbar-gutter:stable]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-apple-mist bg-white">
              <div className="px-4 py-3 border-b border-apple-mist">
                <p className="text-2xs font-semibold uppercase tracking-widest">
                  Adjustments
                </p>
              </div>
              <div className="p-5 space-y-4 max-w-[720px]">
                {/* ─── BUTTONS (SAME WIDTH) ─── */}
                <div className="flex gap-2 w-full">
                  {[
                    { key: "cashAdvance", label: "Cash Advance" },
                    { key: "overtime", label: "Overtime" },
                    { key: "paidLeave", label: "Paid Leave" },
                  ].map((btn) => {
                    const active = activeAdjustmentForm === btn.key;

                    return (
                      <button
                        key={btn.key}
                        type="button"
                        onClick={() =>
                          setActiveAdjustmentForm((prev) =>
                            prev === btn.key ? null : (btn.key as any),
                          )
                        }
                        className={`flex-1 h-10 rounded-xl border text-sm font-semibold transition ${
                          active
                            ? "bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        + Add {btn.label}
                      </button>
                    );
                  })}
                </div>

                {/* ─── CASH ADVANCE ─── */}
                {activeAdjustmentForm === "cashAdvance" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addCashAdvance();
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-apple-snow/40 p-4 space-y-4"
                  >
                    <div className="flex flex-wrap gap-4">
                      <div className="flex flex-col w-full sm:w-[240px]">
                        <label className="text-xs text-gray-500 mb-1">
                          Cash Advance Amount
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={cashAdvanceInput}
                          onChange={(e) =>
                            setCashAdvanceInput(
                              normalizeNumericInput(e.target.value),
                            )
                          }
                          className="h-10 px-3 rounded-xl border border-apple-charcoal/40  hover:border-apple-charcoal focus:outline-none  text-sm font-semibold focus:bg-white focus:border-black"
                        />
                      </div>

                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-500 mb-1">
                          Notes
                        </label>
                        <input
                          type="text"
                          placeholder="(Optional)"
                          value={cashAdvanceNotes}
                          onChange={(e) => setCashAdvanceNotes(e.target.value)}
                          className="h-10 px-3 rounded-xl border border-apple-charcoal/40  hover:border-apple-charcoal focus:outline-none  text-sm  focus:bg-white focus:border-black"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveAdjustmentForm(null)}
                        className="h-9 px-4 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="h-9 px-4 rounded-lg bg-emerald-700 text-white text-sm  font-semibold hover:bg-emerald-800"
                      >
                        Add Cash Advance
                      </button>
                    </div>
                  </form>
                )}

                {/* ─── OVERTIME ─── */}
                {activeAdjustmentForm === "overtime" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addOvertime();
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-apple-snow/40 p-4 space-y-4"
                  >
                    <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800">
                      Submit the payroll report after adding overtime so this
                      request can
                      be submitted for CEO approval.
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex flex-col w-full sm:w-[200px]">
                        <label className="text-xs text-gray-500 mb-1">
                          Overtime Hours
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={overtimeHoursInput}
                          onChange={(e) =>
                            {
                              setOvertimeHoursInput(
                                normalizeNumericInput(e.target.value),
                              );
                              setOvertimeValidationMessage(null);
                            }
                          }
                          className="h-10 px-3 rounded-xl border border-apple-charcoal/40  hover:border-apple-charcoal focus:outline-none  text-sm  focus:bg-white focus:border-black"
                        />
                      </div>

                      <div className="flex flex-col w-full sm:w-[200px]">
                        <label className="text-xs text-gray-500 mb-1">
                          Overtime Pay (₱)
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={overtimePayInput}
                          onChange={(e) =>
                            {
                              setOvertimePayInput(
                                normalizeNumericInput(e.target.value),
                              );
                              setOvertimeValidationMessage(null);
                            }
                          }
                          className="h-10 px-3 rounded-xl border border-apple-charcoal/40  hover:border-apple-charcoal focus:outline-none  text-sm  focus:bg-white focus:border-black"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 mb-1">
                        Notes
                      </label>
                      <input
                        type="text"
                        placeholder="(Optional)"
                        value={overtimeNotes}
                        onChange={(e) => {
                          setOvertimeNotes(e.target.value);
                          setOvertimeValidationMessage(null);
                        }}
                        className="h-10 px-3 rounded-xl border border-apple-charcoal/40  hover:border-apple-charcoal focus:outline-none  text-sm  focus:bg-white focus:border-black"
                      />
                    </div>

                    {overtimeValidationMessage ? (
                      <p className="text-xs font-medium text-red-600">
                        {overtimeValidationMessage}
                      </p>
                    ) : null}

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOvertimeValidationMessage(null);
                          setActiveAdjustmentForm(null);
                        }}
                        className="h-9 px-4 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={
                          parseNonNegativeValue(overtimeHoursInput) <= 0 ||
                          parseNonNegativeValue(overtimePayInput) <= 0
                        }
                        className="h-9 px-4 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
                      >
                        Add Overtime
                      </button>
                    </div>
                  </form>
                )}

                {/* ─── PAID LEAVE ─── */}
                {activeAdjustmentForm === "paidLeave" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addPaidLeave();
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-apple-snow/40 p-4 space-y-4"
                  >
                    <div className="flex flex-wrap gap-4">
                      <div className="flex flex-col w-full sm:w-[200px]">
                        <label className="text-xs text-gray-500 mb-1">
                          Days
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={paidLeaveDaysInput}
                          onChange={(e) =>
                            setPaidLeaveDaysInput(
                              normalizeNumericInput(e.target.value),
                            )
                          }
                          className="h-10 px-3 rounded-xl border border-apple-charcoal/40  hover:border-apple-charcoal focus:outline-none  text-sm  focus:bg-white focus:border-black"
                        />
                      </div>

                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-500 mb-1">
                          Notes
                        </label>
                        <input
                          type="text"
                          placeholder="(Optional)"
                          value={paidLeaveNotes}
                          onChange={(e) => setPaidLeaveNotes(e.target.value)}
                          className="h-10 px-3 rounded-xl border border-apple-charcoal/40  hover:border-apple-charcoal focus:outline-none  text-sm  focus:bg-white focus:border-black"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveAdjustmentForm(null)}
                        className="h-9 px-4 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button className="h-9 px-4 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800">
                        Add Paid Leave
                      </button>
                    </div>
                  </form>
                )}

                {/* ─── ENTRIES ─── */}
                {(cashAdvanceEntries.length > 0 ||
                  overtimeEntries.length > 0 ||
                  paidLeaveEntries.length > 0) && (
                  <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
                    {cashAdvanceEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="font-semibold text-red-500">
                          Cash Advance -{formatPeso(entry.amount)}
                        </span>

                        {entry.notes && (
                          <span className="text-xs text-gray-500 truncate">
                            {entry.notes}
                          </span>
                        )}

                        <button
                          onClick={() => removeCashAdvance(entry.id)}
                          className="ml-auto p-1 rounded-md  text-red-500 hover:bg-red-100 hover:text-red-600 bg-red-50 transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}

                    {overtimeEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="font-semibold text-emerald-600">
                          Overtime +{formatPeso(entry.pay)}
                        </span>

                        <span className="text-xs text-gray-500">
                          ({entry.hours} hrs)
                        </span>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              entry.status === "approved"
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                : entry.status === "rejected"
                                  ? "border border-red-200 bg-red-50 text-red-700"
                                  : "border border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {entry.status === "approved"
                              ? "Approved"
                              : entry.status === "rejected"
                                ? "Rejected"
                                : "Pending"}
                          </span>

                        {entry.notes && (
                          <span className="text-xs text-gray-500 truncate">
                            {entry.notes}
                          </span>
                        )}

                        {entry.status !== "approved" ? (
                          <button
                            onClick={() => removeOvertime(entry.id)}
                            className="ml-auto p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                          >
                            <X size={14} />
                          </button>
                        ) : null}
                      </div>
                    ))}

                    {paidLeaveEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="font-semibold text-emerald-600">
                          Paid Leave +{formatPeso(entry.pay)}
                        </span>

                        <span className="text-xs text-gray-500">
                          ({entry.days} days)
                        </span>

                        {entry.notes && (
                          <span className="text-xs text-gray-500 truncate">
                            {entry.notes}
                          </span>
                        )}

                        <button
                          onClick={() => removePaidLeave(entry.id)}
                          className="ml-auto p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-apple-mist bg-white">
              <div className="px-4 py-3 border-b border-apple-mist">
                <p className="text-2xs font-semibold uppercase tracking-widest">
                  All Report Logs
                </p>
                {paidHolidayBonusDays > 0 && (
                  <p className="mt-1 text-xs font-semibold text-sky-700">
                    {paidHolidayBonusDays} paid holiday day
                    {paidHolidayBonusDays === 1 ? "" : "s"} added for this
                    employee.
                  </p>
                )}
                {underHoursLogs.length > 0 && (
                  <p className="mt-1 text-xs font-semibold text-amber-700">
                    Under-8 logs are not full paid days by themselves, but their
                    hours accumulate toward total paid days.
                  </p>
                )}
                {overtimeLogs.length > 0 && (
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    Hours above 8 are tagged as overtime. Overtime pay stays
                    pending until CEO approval.
                  </p>
                )}
                {highOvertimeHoursLogs.length > 0 && (
                  <p className="mt-1 text-xs font-semibold text-rose-700">
                    Logs with 10.00 hours or more are flagged for overtime
                    review before saving.
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead>
                    <tr className="border-b border-apple-mist">
                      {[
                        "Date/Week",
                        "Site",
                        "Time1 In",
                        "Time1 Out",
                        "Time2 In",
                        "Time2 Out",
                        "OT In",
                        "OT Out",
                        "Hours",
                      ].map((h) => (
                        <th
                          key={h}
                          className={`px-3 py-2.5 text-2xs font-semibold uppercase tracking-widest text-apple-steel ${
                            h === "Hours" ? "text-right" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.editingPayrollLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-3 py-5 text-center text-sm text-apple-smoke"
                        >
                          No attendance logs found for this worker.
                        </td>
                      </tr>
                    ) : (
                      payroll.editingPayrollLogs.map((log, index) => {
                        const isPaidHoliday = holidayLogDateSet.has(log.date);
                        const isUnderRequiredHours =
                          getHoursNumber(log) > 0 &&
                          getHoursNumber(log) < FULL_WORKDAY_HOURS;
                        const isHighOvertimeHours =
                          getHoursNumber(log) >= OVERTIME_ALERT_HOURS &&
                          !isPaidHoliday;
                        const isOvertimeDay =
                          computeSameDayOvertimeMinutes(log.otIn, log.otOut) > 0 &&
                          !isPaidHoliday;
                        const statusFallback = (
                          <span className="text-red-500">Missed</span>
                        );

                        return (
                          <tr
                            key={`${log.date}-${log.employee}-${log.site}-${index}`}
                            className={`border-b border-apple-mist/60 last:border-0 ${
                              isPaidHoliday
                                ? "bg-sky-50/50"
                                : isHighOvertimeHours
                                  ? "bg-rose-50/60"
                                  : isUnderRequiredHours
                                  ? "bg-yellow-50"
                                  : "odd:bg-apple-snow/30"
                            }`}
                          >
                            <td className="px-3 py-2.5 text-sm text-apple-charcoal">
                              <div className="flex items-center gap-2">
                                <span className="inline-block min-w-[3rem]">
                                  {toWeekLabel(log.date)}
                                </span>
                                {isPaidHoliday && (
                                  <span className="w-fit rounded-full border border-sky-200 bg-sky-100 px-2 py-0.5 text-2xs font-semibold text-sky-700">
                                    Paid Holiday
                                  </span>
                                )}
                                {isUnderRequiredHours && !isPaidHoliday && (
                                  <span className="w-fit rounded-full border border-yellow-300 bg-yellow-100 px-2 py-0.5 text-2xs font-semibold text-yellow-800">
                                    Under 8h
                                  </span>
                                )}
                                {isHighOvertimeHours && (
                                  <span className="w-fit rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-2xs font-semibold text-rose-800">
                                    10h+ Overtime
                                  </span>
                                )}
                                {isOvertimeDay && !isHighOvertimeHours && (
                                  <span className="w-fit rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-2xs font-semibold text-emerald-800">
                                    Overtime
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-apple-smoke">
                              {extractSiteName(log.site) || "-"}
                            </td>
                            <td className="px-3 py-2.5 text-sm text-apple-charcoal">
                              {log.time1In
                                ? formatLogTime(log.time1In)
                                : isPaidHoliday
                                  ? "-"
                                  : statusFallback}
                            </td>
                            <td className="px-3 py-2.5 text-sm text-apple-charcoal">
                              {log.time1Out
                                ? formatLogTime(log.time1Out)
                                : isPaidHoliday
                                  ? "-"
                                  : statusFallback}
                            </td>
                            <td className="px-3 py-2.5 text-sm text-apple-charcoal">
                              {log.time2In
                                ? formatLogTime(log.time2In)
                                : isPaidHoliday
                                  ? "-"
                                  : statusFallback}
                            </td>
                            <td className="px-3 py-2.5 text-sm text-apple-charcoal">
                              {log.time2Out
                                ? formatLogTime(log.time2Out)
                                : isPaidHoliday
                                  ? "-"
                                  : statusFallback}
                            </td>
                            <td className="px-3 py-2.5 text-sm text-apple-charcoal">
                              {formatLogTime(log.otIn)}
                            </td>
                            <td className="px-3 py-2.5 text-sm text-apple-charcoal">
                              {formatLogTime(log.otOut)}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                onFocus={(e) => e.currentTarget.select()}
                                value={getHoursValue(log)}
                                onChange={(e) =>
                                  payroll.updateLogHour(log, e.target.value)
                                }
                                className="w-20 hover:border-apple-charcoal text-right px-2 py-1 rounded-lg border border-apple-charcoal/40 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-apple-charcoal/20"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-apple-mist bg-white">
              <div className="px-4 py-3 border-b border-apple-mist">
                <p className="text-2xs font-semibold uppercase tracking-widest">
                  Source Summary
                </p>
                <p className="text-sm text-apple-smoke mt-1">
                  {payroll.editingPayrollLogs.length} attendance log row
                  {payroll.editingPayrollLogs.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    label: "Absences (Day)",
                    value: String(payroll.editingPayrollSummary.absenceDays),
                  },
                  {
                    label: "Attendance (Day)",
                    value: String(payroll.editingPayrollSummary.attendanceDays),
                  },
                  {
                    label: "Computed Paid Days",
                    value: formatPayrollNumber(daysWorked),
                  },
                  {
                    label: "Total Worked Hours",
                    value: `${formatPayrollNumber(totalWorkedHours)} hrs`,
                  },
                  {
                    label: "Pending Overtime",
                    value: `${formatPayrollNumber(pendingOvertimeHours)} hrs`,
                  },
                    {
                      label: "Approved Overtime",
                      value: `${formatPayrollNumber(approvedOvertimeHours)} hrs`,
                    },
                    {
                      label: "Rejected Overtime",
                      value: `${formatPayrollNumber(rejectedOvertimeHours)} hrs`,
                    },
                    {
                      label: "Paid Leave",
                      value: formatPeso(paidLeavePay),
                  },
                  {
                    label: "Paid Holidays (Day)",
                    value: String(paidHolidayBonusDays),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl  px-3 py-2 hover:shadow-[0_8px_18px_rgba(24,83,43,0.06)] bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] "
                  >
                    <p className="text-2xs font-medium text-white/65 uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className="mt-1 text-lg font-semibold font-mono text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-apple-mist bg-white">
              <div className="px-4 py-3 border-b border-apple-mist">
                <p className="text-2xs font-semibold uppercase tracking-widest">
                  Computation Summary
                </p>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-apple-charcoal">
                    Total Worked Hours
                  </span>
                  <span className="font-mono font-semibold text-apple-charcoal text-right">
                    {formatPayrollNumber(totalWorkedHours)} hrs
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-apple-charcoal">
                    Days Worked (floor(hours/8))
                  </span>
                  <span className="font-mono font-semibold text-apple-charcoal text-right">
                    {formatPayrollNumber(daysWorked)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-apple-charcoal">Base Pay</span>
                  <span className="font-mono font-semibold text-apple-charcoal text-right">
                    {formatPeso(baseWorkedPay)}
                  </span>
                </div>
                {sitePayBreakdownWithAllocation.length > 1 && (
                  <div className="rounded-xl border border-apple-mist bg-apple-snow/70 px-3 py-2">
                    <p className="text-2xs font-semibold uppercase tracking-widest text-apple-smoke">
                      Branch Rate Breakdown
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {sitePayBreakdownWithAllocation.map((entry) => (
                        <div
                          key={entry.site}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="text-apple-charcoal">
                            {entry.site} · {formatPayrollNumber(entry.hours)} hrs
                            {" · "}
                            {formatPayrollNumber(entry.payableDays)} payable day(s)
                          </span>
                          <span className="font-mono font-semibold text-apple-charcoal text-right">
                            {formatPeso(entry.ratePerDay)}/day
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-apple-charcoal">+ Paid Holiday</span>
                  <span className="font-mono font-semibold text-emerald-700 text-right">
                    {formatPeso(paidHolidayPay)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-apple-charcoal">
                    + Approved Overtime
                  </span>
                  <span className="font-mono font-semibold text-emerald-700 text-right">
                    {formatPeso(approvedOvertimePay)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-apple-charcoal">
                    + Pending Overtime
                  </span>
                  <span className="font-mono font-semibold text-amber-700 text-right">
                    {formatPeso(pendingOvertimePay)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-apple-charcoal">
                    + Rejected Overtime
                  </span>
                  <span className="font-mono font-semibold text-red-700 text-right">
                    {formatPeso(rejectedOvertimePay)}
                  </span>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                  Pending overtime is excluded from total pay until the CEO approves it.
                </div>
                {rejectedOvertimeEntries.length > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    Rejected overtime stays excluded from total pay until HR submits a new request.
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-apple-charcoal">+ Paid Leave</span>
                  <span className="font-mono font-semibold text-emerald-700 text-right">
                    {formatPeso(paidLeavePay)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-apple-charcoal">- Cash Advance</span>
                  <span className="font-mono font-semibold text-red-600 text-right">
                    {formatPeso(cashAdvanceAmount)}
                  </span>
                </div>
                {belowFullDayThreshold && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                    Worked hours are below 8.00, so no full paid day is counted
                    yet.
                  </div>
                )}
                {hasHoursReviewWarning && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                    Overtime hours (10h+) or lacking time (&lt;8h) may affect
                    payroll calculation. Please double-check all logs before
                    saving.
                  </div>
                )}
                <div className="border-t border-apple-mist pt-2 mt-2 flex items-center justify-between gap-3">
                  <span className="text-base font-bold text-apple-charcoal">
                    Adjusted Total Pay
                  </span>
                  <span className="text-xl font-mono font-bold text-apple-charcoal text-right">
                    {formatPeso(adjustedTotalPay)}
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E7ECF3] ">
              <div className="border-b border-[#EEF2F7] px-4 py-3.5">
                <h4 className="text-sm font-semibold tracking-tight text-apple-charcoal">
                  Employee Analytics
                </h4>
                <p className="mt-1 text-xs text-apple-smoke">
                  Visual insights into the employee&apos;s attendance and work
                  patterns.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 p-4 md:grid-cols-3">
                <div className="rounded-2xl border border-[#E8EDF5] bg-gradient-to-b from-white to-[#FAFCFF] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-apple-charcoal">
                    Daily Hours Worked Trend
                  </p>
                  <div className="h-[230px]">
                    {payroll.employeeDailyHoursTrend.length === 0 ? (
                      <p className="text-sm text-apple-smoke">
                        No attendance logs yet.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={payroll.employeeDailyHoursTrend}
                          margin={{ top: 12, right: 10, left: -14, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="employeeHoursArea"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor={DAILY_HOURS_AREA_COLOR}
                                stopOpacity={0.5}
                              />
                              <stop
                                offset="95%"
                                stopColor={DAILY_HOURS_AREA_COLOR}
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="4 4"
                            vertical={false}
                            stroke={DAILY_HOURS_GRID_COLOR}
                          />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: "rgb(var(--theme-chart-axis))",
                              fontSize: 11,
                            }}
                            tickFormatter={chartTickFormatter}
                            minTickGap={16}
                            tickMargin={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: "rgb(var(--theme-chart-axis))",
                              fontSize: 11,
                            }}
                            domain={[
                              0,
                              (dataMax: number) =>
                                Math.max(8, Math.ceil(dataMax + 1)),
                            ]}
                            tickCount={5}
                            tickMargin={8}
                          />
                          <Tooltip
                            cursor={{
                              stroke: DAILY_HOURS_LINE_COLOR,
                              strokeWidth: 2,
                              strokeDasharray: "5 5",
                            }}
                            content={
                              <AnalyticsTooltip
                                valueFormatter={(value) =>
                                  `${formatPayrollNumber(value)} hrs`
                                }
                              />
                            }
                          />
                          <Area
                            type="monotone"
                            dataKey="hoursWorked"
                            fill="url(#employeeHoursArea)"
                            stroke="none"
                            isAnimationActive={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="hoursWorked"
                            stroke={DAILY_HOURS_LINE_COLOR}
                            strokeWidth={3}
                            dot={{
                              r: 3,
                              fill: "#fff",
                              stroke: DAILY_HOURS_LINE_COLOR,
                              strokeWidth: 2,
                            }}
                            activeDot={{
                              r: 5,
                              fill: DAILY_HOURS_LINE_COLOR,
                              stroke: "#fff",
                              strokeWidth: 2,
                            }}
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E8EDF5] bg-gradient-to-b from-white to-[#FAFCFF] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-apple-charcoal">
                    Attendance Breakdown
                  </p>
                  <div className="h-[230px]">
                    {payroll.employeeAttendanceBreakdown.every(
                      (item) => item.value === 0,
                    ) ? (
                      <p className="text-sm text-apple-smoke">
                        No attendance distribution yet.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={payroll.employeeAttendanceBreakdown}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={42}
                            outerRadius={72}
                            paddingAngle={3}
                            stroke="none"
                            isAnimationActive={false}
                          >
                            {payroll.employeeAttendanceBreakdown.map(
                              (entry, index) => (
                                <Cell
                                  key={`${entry.name}-${index}`}
                                  fill={getAttendanceBreakdownColor(
                                    entry.name,
                                    index,
                                  )}
                                />
                              ),
                            )}
                          </Pie>
                          <Tooltip
                            content={
                              <AnalyticsTooltip
                                valueFormatter={(value) =>
                                  `${formatPayrollNumber(value)} day(s)`
                                }
                              />
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {payroll.employeeAttendanceBreakdown.map((item, index) => (
                      <div
                        key={`attendance-legend-${item.name}`}
                        className="flex items-center gap-2"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: getAttendanceBreakdownColor(
                              item.name,
                              index,
                            ),
                          }}
                        />
                        <span className="truncate text-[11px] text-apple-smoke">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E8EDF5] bg-gradient-to-b from-white to-[#FAFCFF] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-apple-charcoal">
                    Clock-in Time Consistency
                  </p>
                  <div className="h-[230px]">
                    {payroll.employeeClockInConsistency.length === 0 ? (
                      <p className="text-sm text-apple-smoke">
                        No clock-in data yet.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={payroll.employeeClockInConsistency}
                          margin={{ top: 12, right: 10, left: -14, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="clockInBar"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor={CLOCK_IN_BAR_TOP_COLOR}
                                stopOpacity={0.95}
                              />
                              <stop
                                offset="95%"
                                stopColor={CLOCK_IN_BAR_BOTTOM_COLOR}
                                stopOpacity={0.85}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="4 4"
                            vertical={false}
                            stroke={CLOCK_IN_GRID_COLOR}
                          />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: "rgb(var(--theme-chart-axis))",
                              fontSize: 11,
                            }}
                            tickFormatter={chartTickFormatter}
                            minTickGap={16}
                            tickMargin={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: "rgb(var(--theme-chart-axis))",
                              fontSize: 11,
                            }}
                            domain={[0, 24]}
                            tickMargin={8}
                          />
                          <Tooltip
                            cursor={{ fill: "rgb(var(--theme-chart-cursor))" }}
                            content={
                              <AnalyticsTooltip
                                valueFormatter={(_value, _name, item) =>
                                  item?.timeInLabel ?? "-"
                                }
                              />
                            }
                          />
                          <Bar
                            dataKey="timeIn"
                            name="Time In"
                            fill="url(#clockInBar)"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={26}
                            isAnimationActive={false}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              {/* <p className="text-xs text-apple-steel">
              Saving total hours:{" "}
              <span className="font-semibold text-apple-charcoal">
                {formatPayrollNumber(
                  payroll.hasLogHourOverrides
                    ? payroll.totalEditedLogHours
                    : parseNonNegativeOrFallback(
                        payrollEditDraft.hoursWorked,
                        editingPayrollRow.hoursWorked,
                      ),
                )}
              </span>
            </p> */}
              <div className="invisible"></div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={payroll.closePayrollEditModal}
                  disabled={isSavingChanges}
                  className="px-4 h-10 rounded-2xl border border-apple-silver text-sm font-semibold text-apple-ash hover:border-apple-charcoal transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSaveChanges();
                  }}
                  disabled={isSavingChanges}
                  className="inline-flex px-4 h-10 items-center gap-2 rounded-2xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingChanges ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
