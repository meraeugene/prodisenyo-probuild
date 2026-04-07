"use client";

import { useMemo } from "react";
import type {
  HistoricalDashboardAttendanceLog,
  HistoricalDashboardDailyTotal,
  HistoricalDashboardPayrollItem,
} from "@/features/dashboard/hooks/useHistoricalDashboardData";
import {
  buildDailyRows,
  formatLogDate,
  formatLogTime,
  formatPeso,
  normalizeKey,
} from "@/features/dashboard/utils/ceoDepartmentReviewHelpers";
import { formatPayrollNumber } from "@/features/payroll/utils/payrollFormatters";
import {
  MetricRow,
  ModalShell,
  SummaryStat,
} from "@/features/dashboard/components/CeoDepartmentReviewModalParts";

interface CeoEmployeeLogsModalProps {
  attendancePeriod: string;
  item: HistoricalDashboardPayrollItem;
  attendanceLogs: HistoricalDashboardAttendanceLog[];
  dailyTotals: HistoricalDashboardDailyTotal[];
  onClose: () => void;
}

export default function CeoEmployeeLogsModal({
  attendancePeriod,
  item,
  attendanceLogs,
  dailyTotals,
  onClose,
}: CeoEmployeeLogsModalProps) {
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
          <SummaryStat label="Total Paid" value={formatPeso(item.total_pay)} />
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
                <MetricRow label="Regular Pay" value={formatPeso(item.regular_pay)} />
                <MetricRow label="Overtime Pay" value={formatPeso(item.overtime_pay)} />
                <MetricRow label="Holiday Pay" value={formatPeso(item.holiday_pay)} />
                <MetricRow
                  label="Deductions"
                  value={formatPeso(item.deductions_total)}
                  valueClass="text-rose-700"
                />
                <MetricRow
                  label="Net Paid"
                  value={formatPeso(item.total_pay)}
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
              <SummaryStat label="IN Logs" value={inLogs.toLocaleString("en-PH")} />
              <SummaryStat
                label="OUT Logs"
                value={outLogs.toLocaleString("en-PH")}
              />
              <SummaryStat label="OT Logs" value={otLogs.toLocaleString("en-PH")} />
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
                      <td colSpan={6} className="px-3 py-4 text-center text-apple-steel">
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
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-apple-steel">Date</th>
                    <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">Hours</th>
                    <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-apple-steel">Paid</th>
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
                          {formatPeso(row.total_pay ?? 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-apple-steel">
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
