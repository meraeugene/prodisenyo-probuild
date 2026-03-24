"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
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
import { ROLE_CODE_TO_NAME, type RoleCode } from "@/lib/payrollConfig";
import type { DailyLogRow } from "@/types";
import type { UsePayrollStateResult } from "@/features/payroll/hooks/usePayrollState";
import {
  formatPayrollNumber,
  normalizeNumericInput,
  toWeekLabel,
} from "@/features/payroll/utils/payrollFormatters";
import { getLogOverrideKey } from "@/features/payroll/utils/payrollMappers";

const EMPLOYEE_ANALYTICS_COLORS = [
  "#2563eb",
  "#ef4444",
  "#14b8a6",
  "#f59e0b",
  "#a855f7",
];

const DAILY_HOURS_LINE_COLOR = "#1d4ed8";
const DAILY_HOURS_AREA_COLOR = "#3b82f6";
const DAILY_HOURS_GRID_COLOR = "#bfdbfe";
const PAID_LEAVE_RATE_PER_DAY = 500;

type AdjustmentFormType = "cashAdvance" | "overtime" | "paidLeave" | null;

interface CashAdvanceEntry {
  id: number;
  amount: number;
  notes: string;
}

interface OvertimeEntry {
  id: number;
  hours: number;
  pay: number;
  notes: string;
}

interface PaidLeaveEntry {
  id: number;
  days: number;
  pay: number;
  notes: string;
}


function parseNonNegativeValue(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function formatPeso(value: number): string {
  return `\u20B1${formatPayrollNumber(value)}`;
}

function getAttendanceBreakdownColor(name: string, index: number): string {
  const key = name.trim().toLowerCase();
  if (key.includes("attendance")) return "#2563eb";
  if (key.includes("absence")) return "#ef4444";
  if (key.includes("leave")) return "#14b8a6";
  if (key.includes("business trip")) return "#f59e0b";
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
  const { editingPayrollRow, payrollEditDraft } = payroll;

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
    CashAdvanceEntry[]
  >([]);
  const [overtimeEntries, setOvertimeEntries] = useState<OvertimeEntry[]>([]);
  const [paidLeaveEntries, setPaidLeaveEntries] = useState<PaidLeaveEntry[]>(
    [],
  );

  useEffect(() => {
    setActiveAdjustmentForm(null);
    setCashAdvanceInput("");
    setCashAdvanceNotes("");
    setOvertimeHoursInput("");
    setOvertimePayInput("");
    setOvertimeNotes("");
    setPaidLeaveDaysInput("");
    setPaidLeaveNotes("");
    setCashAdvanceEntries([]);
    setOvertimeEntries([]);
    setPaidLeaveEntries([]);
  }, [editingPayrollRow?.id]);

  if (!editingPayrollRow || !payrollEditDraft) return null;

  function getHoursValue(log: DailyLogRow): string {
    const key = getLogOverrideKey(log);
    const value = payroll.logHourOverrides[key] ?? log.hours;
    return normalizeNumericInput(String(value));
  }

  const loggedSites = Array.from(
    new Set(
      payroll.editingPayrollLogs
        .map((log) => log.site.trim())
        .filter((site) => site.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const loggedSitesLabel =
    loggedSites.length > 0 ? loggedSites.join(", ") : editingPayrollRow.site;
  const minimumPaidHours = 8;
  const fixedDailyPay = 500;
  const currentLogsForPay = payroll.editingPayrollLogsForAnalytics;
  const editingDates = new Set(payroll.editingPayrollLogs.map((log) => log.date));
  const holidayLogDateSet = new Set(
    payroll.paidHolidays
      .map((holiday) => holiday.date)
      .filter((date) => editingDates.has(date)),
  );
  const qualifyingWorkedLogs = currentLogsForPay.filter(
    (log) => log.hours >= minimumPaidHours,
  );
  const paidHolidayRows = currentLogsForPay.filter((log) =>
    holidayLogDateSet.has(log.date),
  );
  const paidHolidayOnlyRows = paidHolidayRows.filter(
    (log) => log.hours < minimumPaidHours,
  );
  const underHoursLogs = currentLogsForPay.filter(
    (log) =>
      log.hours > 0 &&
      log.hours < minimumPaidHours &&
      !holidayLogDateSet.has(log.date),
  );
  const baseWorkedPay = qualifyingWorkedLogs.length * fixedDailyPay;
  const paidHolidayPay = paidHolidayOnlyRows.length * fixedDailyPay;
  const previewTotalPay = baseWorkedPay + paidHolidayPay;
  const cashAdvanceAmount = cashAdvanceEntries.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );
  const overtimeHours = overtimeEntries.reduce(
    (sum, entry) => sum + entry.hours,
    0,
  );
  const approvedOvertimePay = overtimeEntries.reduce(
    (sum, entry) => sum + entry.pay,
    0,
  );
  const paidLeaveDays = paidLeaveEntries.reduce(
    (sum, entry) => sum + entry.days,
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
        id: Date.now() + Math.floor(Math.random() * 1000),
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
    if (hours <= 0 && pay <= 0) return;

    setOvertimeEntries((prev) => [
      ...prev,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        hours: Number(hours.toFixed(2)),
        pay: Number(pay.toFixed(2)),
        notes: overtimeNotes.trim(),
      },
    ]);
    setOvertimeHoursInput("");
    setOvertimePayInput("");
    setOvertimeNotes("");
    setActiveAdjustmentForm(null);
  }

  function addPaidLeave() {
    const days = parseNonNegativeValue(paidLeaveDaysInput);
    if (days <= 0) return;
    const pay = Number((days * PAID_LEAVE_RATE_PER_DAY).toFixed(2));

    setPaidLeaveEntries((prev) => [
      ...prev,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        days: Number(days.toFixed(2)),
        pay,
        notes: paidLeaveNotes.trim(),
      },
    ]);
    setPaidLeaveDaysInput("");
    setPaidLeaveNotes("");
    setActiveAdjustmentForm(null);
  }

  function removeCashAdvance(id: number) {
    setCashAdvanceEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  function removeOvertime(id: number) {
    setOvertimeEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  function removePaidLeave(id: number) {
    setPaidLeaveEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-6xl max-h-[88vh] overflow-y-auto rounded-lg border border-apple-mist bg-white shadow-apple-xs">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-apple-mist px-5 sm:px-7 py-4 flex items-start justify-between gap-3">
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
              <span className="px-2.5 py-1 rounded-full bg-apple-charcoal text-xs font-medium text-white">
                {ROLE_CODE_TO_NAME[editingPayrollRow.role as RoleCode] ??
                  "Unknown Role"}
              </span>

              <span className="text-apple-silver">&middot;</span>

              {/* Site */}
              <span className="text-sm ">{loggedSitesLabel}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={payroll.closePayrollEditModal}
            className="w-8 h-8 rounded-full  text-white bg-apple-charcoal hover:bg-apple-charcoal/90  transition flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 sm:px-7 py-5 sm:py-6 space-y-5">
          <div className="rounded-2xl border border-apple-mist bg-white">
            <div className="px-4 py-3 border-b border-apple-mist">
              <p className="text-2xs font-semibold uppercase tracking-widest">
                Adjustments
              </p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveAdjustmentForm((prev) =>
                      prev === "cashAdvance" ? null : "cashAdvance",
                    )
                  }
                  className="px-3.5 py-2 rounded-xl border border-apple-silver text-xs font-semibold text-apple-ash hover:border-apple-charcoal transition"
                >
                  + Add Cash Advance
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveAdjustmentForm((prev) =>
                      prev === "overtime" ? null : "overtime",
                    )
                  }
                  className="px-3.5 py-2 rounded-xl border border-apple-silver text-xs font-semibold text-apple-ash hover:border-apple-charcoal transition"
                >
                  + Add Overtime
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveAdjustmentForm((prev) =>
                      prev === "paidLeave" ? null : "paidLeave",
                    )
                  }
                  className="px-3.5 py-2 rounded-xl border border-apple-silver text-xs font-semibold text-apple-ash hover:border-apple-charcoal transition"
                >
                  + Add Paid Leave
                </button>
              </div>

              {activeAdjustmentForm === "cashAdvance" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addCashAdvance();
                  }}
                  className="rounded-xl border border-apple-mist bg-apple-snow p-3 space-y-2"
                >
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Input Cash Advance"
                    value={cashAdvanceInput}
                    onChange={(e) =>
                      setCashAdvanceInput(normalizeNumericInput(e.target.value))
                    }
                    className="w-full font-semibold hover:border-apple-charcoal px-3 h-10 rounded-2xl border border-apple-silver bg-white text-sm text-apple-charcoal focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15 focus:border-apple-charcoal transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={cashAdvanceNotes}
                    onChange={(e) => setCashAdvanceNotes(e.target.value)}
                    className="w-full px-3 h-10 rounded-2xl border border-apple-silver bg-white text-sm text-apple-charcoal focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15 focus:border-apple-charcoal transition-all"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveAdjustmentForm(null)}
                      className="px-3 py-1.5 rounded-lg border border-apple-silver text-2xs font-semibold text-apple-ash hover:border-apple-charcoal transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-apple-charcoal text-white text-2xs font-semibold hover:bg-apple-black transition"
                    >
                      Add Cash Advance
                    </button>
                  </div>
                </form>
              )}

              {activeAdjustmentForm === "overtime" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addOvertime();
                  }}
                  className="rounded-xl border border-apple-mist bg-apple-snow p-3 space-y-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Overtime Hours (hrs)"
                      value={overtimeHoursInput}
                      onChange={(e) =>
                        setOvertimeHoursInput(
                          normalizeNumericInput(e.target.value),
                        )
                      }
                      className="w-full px-3 h-10 rounded-2xl border border-apple-silver bg-white text-sm text-apple-charcoal focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15 focus:border-apple-charcoal transition-all"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Overtime Pay (PHP)"
                      value={overtimePayInput}
                      onChange={(e) =>
                        setOvertimePayInput(normalizeNumericInput(e.target.value))
                      }
                      className="w-full px-3 h-10 rounded-2xl border border-apple-silver bg-white text-sm text-apple-charcoal focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15 focus:border-apple-charcoal transition-all"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={overtimeNotes}
                    onChange={(e) => setOvertimeNotes(e.target.value)}
                    className="w-full px-3 h-10 rounded-2xl border border-apple-silver bg-white text-sm text-apple-charcoal focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15 focus:border-apple-charcoal transition-all"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveAdjustmentForm(null)}
                      className="px-3 py-1.5 rounded-lg border border-apple-silver text-2xs font-semibold text-apple-ash hover:border-apple-charcoal transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-apple-charcoal text-white text-2xs font-semibold hover:bg-apple-black transition"
                    >
                      Add Overtime
                    </button>
                  </div>
                </form>
              )}

              {activeAdjustmentForm === "paidLeave" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addPaidLeave();
                  }}
                  className="rounded-xl border border-apple-mist bg-apple-snow p-3 space-y-2"
                >
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Days"
                    value={paidLeaveDaysInput}
                    onChange={(e) =>
                      setPaidLeaveDaysInput(normalizeNumericInput(e.target.value))
                    }
                    className="w-full px-3 h-10 rounded-2xl border border-apple-silver bg-white text-sm text-apple-charcoal focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15 focus:border-apple-charcoal transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={paidLeaveNotes}
                    onChange={(e) => setPaidLeaveNotes(e.target.value)}
                    className="w-full px-3 h-10 rounded-2xl border border-apple-silver bg-white text-sm text-apple-charcoal focus:outline-none focus:ring-2 focus:ring-apple-charcoal/15 focus:border-apple-charcoal transition-all"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveAdjustmentForm(null)}
                      className="px-3 py-1.5 rounded-lg border border-apple-silver text-2xs font-semibold text-apple-ash hover:border-apple-charcoal transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-apple-charcoal text-white text-2xs font-semibold hover:bg-apple-black transition"
                    >
                      Add Paid Leave
                    </button>
                  </div>
                </form>
              )}

              {(cashAdvanceEntries.length > 0 ||
                overtimeEntries.length > 0 ||
                paidLeaveEntries.length > 0) && (
                <div className="rounded-xl border border-apple-mist bg-white p-3 space-y-2">
                  {cashAdvanceEntries.map((entry) => (
                    <div
                      key={`cash-${entry.id}`}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="font-semibold text-red-600">
                        Cash Advance -{formatPeso(entry.amount)}
                      </span>
                      {entry.notes ? (
                        <span className="text-xs text-apple-steel truncate">
                          {entry.notes}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeCashAdvance(entry.id)}
                        className="ml-auto px-2.5 py-1 rounded-lg border border-red-300 text-2xs font-semibold text-red-600 hover:bg-red-50 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {overtimeEntries.map((entry) => (
                    <div
                      key={`ot-${entry.id}`}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="font-semibold text-emerald-700">
                        Overtime +{formatPeso(entry.pay)}
                      </span>
                      <span className="text-xs text-apple-steel">
                        ({formatPayrollNumber(entry.hours)} hrs)
                      </span>
                      {entry.notes ? (
                        <span className="text-xs text-apple-steel truncate">
                          {entry.notes}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeOvertime(entry.id)}
                        className="ml-auto px-2.5 py-1 rounded-lg border border-red-300 text-2xs font-semibold text-red-600 hover:bg-red-50 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {paidLeaveEntries.map((entry) => (
                    <div
                      key={`leave-${entry.id}`}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="font-semibold text-emerald-700">
                        Paid Leave +{formatPeso(entry.pay)}
                      </span>
                      <span className="text-xs text-apple-steel">
                        ({formatPayrollNumber(entry.days)} day
                        {entry.days === 1 ? "" : "s"})
                      </span>
                      {entry.notes ? (
                        <span className="text-xs text-apple-steel truncate">
                          {entry.notes}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removePaidLeave(entry.id)}
                        className="ml-auto px-2.5 py-1 rounded-lg border border-red-300 text-2xs font-semibold text-red-600 hover:bg-red-50 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-apple-mist bg-white overflow-x-auto">
            <div className="px-4 py-3 border-b border-apple-mist">
              <p className="text-2xs font-semibold uppercase tracking-widest">
                All Report Logs
              </p>
              {paidHolidayOnlyRows.length > 0 && (
                <p className="mt-1 text-xs font-semibold text-red-700">
                  {paidHolidayOnlyRows.length} paid holiday day
                  {paidHolidayOnlyRows.length === 1 ? "" : "s"} added for this employee.
                </p>
              )}
            </div>
            <table className="w-full text-sm min-w-[980px]">
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
                    const statusFallback = isPaidHoliday ? (
                      <span className="text-red-700 font-semibold">Paid Holiday</span>
                    ) : (
                      <span className="text-red-500">Missed</span>
                    );

                    return (
                      <tr
                        key={`${log.date}-${log.employee}-${log.site}-${index}`}
                        className={`border-b border-apple-mist/60 last:border-0 ${
                          isPaidHoliday ? "bg-red-50/50" : "odd:bg-apple-snow/40"
                        }`}
                      >
                        <td className="px-3 py-2.5 text-sm text-apple-charcoal">
                          {toWeekLabel(log.date)}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-apple-smoke">
                          {log.site || "-"}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-apple-charcoal">
                          {log.time1In || statusFallback}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-apple-charcoal">
                          {log.time1Out || statusFallback}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-apple-charcoal">
                          {log.time2In || statusFallback}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-apple-charcoal">
                          {log.time2Out || statusFallback}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-apple-charcoal">
                          {log.otIn || (isPaidHoliday ? statusFallback : "-")}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-apple-charcoal">
                          {log.otOut || (isPaidHoliday ? statusFallback : "-")}
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
                  label: "Approved Overtime",
                  value: formatPeso(approvedOvertimePay),
                },
                {
                  label: "Paid Leave",
                  value: formatPeso(paidLeavePay),
                },
                {
                  label: "Paid Holidays (Day)",
                  value: String(paidHolidayOnlyRows.length),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl bg-apple-snow border border-apple-mist px-3 py-2"
                >
                  <p className="text-2xs font-medium text-apple-steel uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold font-mono">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {underHoursLogs.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
              {underHoursLogs.length} report log
              {underHoursLogs.length === 1 ? "" : "s"} below 8.00 hours will not
              be paid.
            </div>
          )}

          <div className="rounded-2xl border border-apple-mist bg-white">
            <div className="px-4 py-3 border-b border-apple-mist">
              <p className="text-2xs font-semibold uppercase tracking-widest">
                Computation Summary
              </p>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-apple-charcoal">Base Pay</span>
                <span className="font-mono font-semibold text-apple-charcoal text-right">
                  {formatPeso(baseWorkedPay)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-apple-charcoal">+ Paid Holiday</span>
                <span className="font-mono font-semibold text-emerald-700 text-right">
                  {formatPeso(paidHolidayPay)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-apple-charcoal">+ Approved Overtime</span>
                <span className="font-mono font-semibold text-emerald-700 text-right">
                  {formatPeso(approvedOvertimePay)}
                </span>
              </div>
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
                          tick={{ fill: "rgb(var(--theme-chart-axis))", fontSize: 11 }}
                          tickFormatter={chartTickFormatter}
                          minTickGap={16}
                          tickMargin={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "rgb(var(--theme-chart-axis))", fontSize: 11 }}
                          domain={[
                            0,
                            (dataMax: number) => Math.max(8, Math.ceil(dataMax + 1)),
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
                          animationDuration={900}
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
                          animationDuration={1100}
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
                          isAnimationActive
                          animationDuration={850}
                        >
                          {payroll.employeeAttendanceBreakdown.map(
                            (entry, index) => (
                              <Cell
                                key={`${entry.name}-${index}`}
                                fill={
                                  getAttendanceBreakdownColor(entry.name, index)
                                }
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
                              stopColor="rgb(var(--theme-chart-4))"
                              stopOpacity={0.95}
                            />
                            <stop
                              offset="95%"
                              stopColor="rgb(var(--theme-chart-3))"
                              stopOpacity={0.85}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="4 4"
                          vertical={false}
                          stroke="rgb(var(--theme-chart-grid))"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "rgb(var(--theme-chart-axis))", fontSize: 11 }}
                          tickFormatter={chartTickFormatter}
                          minTickGap={16}
                          tickMargin={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "rgb(var(--theme-chart-axis))", fontSize: 11 }}
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
                          animationDuration={950}
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
                className="px-4 h-10 rounded-2xl border border-apple-silver text-sm font-semibold text-apple-ash hover:border-apple-charcoal transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={payroll.savePayrollEdit}
                className="px-4 h-10 rounded-2xl bg-apple-charcoal text-white text-sm font-semibold hover:bg-apple-black transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



