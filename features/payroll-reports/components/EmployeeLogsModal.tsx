"use client";

import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import {
  buildEmployeeAttendanceModalData,
  formatPayrollReportLogDate,
  formatPayrollReportLogTime,
  formatPayrollReportPeriodLabel,
  formatPayrollReportPeso,
} from "@/features/payroll-reports/utils/payrollReportHelpers";
import {
  PayrollReportMetricRow,
  PayrollReportSummaryCard,
  PayrollReportSummaryChip,
} from "@/features/payroll-reports/components/PayrollReportUiBits";
import { formatPayrollNumber } from "@/features/payroll/utils/payrollFormatters";
import type {
  AttendanceLogRow,
  PayrollRunItemRow,
  PayrollRunRow,
} from "@/features/payroll-reports/types";

const PESO_SIGN = "\u20B1";

export default function EmployeeLogsModal({
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

  const modalData = useMemo(
    () => buildEmployeeAttendanceModalData(report, item, attendanceLogs),
    [attendanceLogs, item, report],
  );

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/45 p-0 backdrop-blur-sm sm:p-4">
      <div className="flex h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none bg-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:h-auto sm:max-h-[90vh] sm:max-w-6xl sm:rounded-2xl">
        <div className="border-b border-apple-mist bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                Calculation Details
              </p>
              <h2 className="mt-2 truncate text-xl font-semibold tracking-[-0.03em] whitespace-nowrap sm:text-2xl">
                {item.employee_name}
              </h2>
              <p className="mt-2 truncate text-xs whitespace-nowrap text-white/80 sm:text-sm">
                {item.role_code} | {item.site_name} |{" "}
                {formatPayrollReportPeriodLabel(report)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 p-0 text-white transition hover:bg-white/20"
              aria-label="Close employee view logs"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="min-h-0 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PayrollReportSummaryCard
              label="Days Worked"
              value={item.days_worked.toLocaleString("en-PH")}
            />
            <PayrollReportSummaryCard
              label="Hours Worked"
              value={item.hours_worked.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            />
            <PayrollReportSummaryCard
              label="Overtime Hours"
              value={item.overtime_hours.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            />
            <PayrollReportSummaryCard
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
                  <PayrollReportMetricRow
                    label="Regular Pay"
                    value={`${PESO_SIGN} ${formatPayrollNumber(item.regular_pay)}`}
                  />
                  <PayrollReportMetricRow
                    label="Overtime Pay"
                    value={`${PESO_SIGN} ${formatPayrollNumber(item.overtime_pay)}`}
                  />
                  <PayrollReportMetricRow
                    label="Holiday Pay"
                    value={`${PESO_SIGN} ${formatPayrollNumber(item.holiday_pay)}`}
                  />
                  <PayrollReportMetricRow
                    label="Deductions"
                    value={`${PESO_SIGN} ${formatPayrollNumber(item.deductions_total)}`}
                    valueClass="text-rose-700"
                  />
                  <PayrollReportMetricRow
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
                <PayrollReportSummaryChip
                  label="Logged Days"
                  value={modalData.attendanceDays}
                />
                <PayrollReportSummaryChip
                  label="IN Logs"
                  value={modalData.inLogs}
                />
                <PayrollReportSummaryChip
                  label="OUT Logs"
                  value={modalData.outLogs}
                />
                <PayrollReportSummaryChip
                  label="OT Logs"
                  value={modalData.otLogs}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-apple-mist bg-white">
              <div className="border-b border-apple-mist px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                  All Report Logs
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[720px] w-full text-xs">
                  <thead>
                    <tr className="bg-[rgb(var(--apple-snow))]">
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider whitespace-nowrap text-apple-steel">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider whitespace-nowrap text-apple-steel">
                        Site
                      </th>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider whitespace-nowrap text-apple-steel">
                        Time1
                      </th>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider whitespace-nowrap text-apple-steel">
                        Time2
                      </th>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider whitespace-nowrap text-apple-steel">
                        OT
                      </th>
                      <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider whitespace-nowrap text-apple-steel">
                        Hours
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-apple-mist">
                    {modalData.dailyRows.length > 0 ? (
                      modalData.dailyRows.map((row) => (
                        <tr key={`${row.date}|||${row.site}`}>
                          <td className="px-3 py-2 whitespace-nowrap text-apple-smoke">
                            {formatPayrollReportLogDate(row.date)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-apple-smoke">
                            {row.site}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-apple-smoke">
                            {formatPayrollReportLogTime(row.time1In || null)} -{" "}
                            {formatPayrollReportLogTime(row.time1Out || null)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-apple-smoke">
                            {formatPayrollReportLogTime(row.time2In || null)} -{" "}
                            {formatPayrollReportLogTime(row.time2Out || null)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-apple-smoke">
                            {formatPayrollReportLogTime(row.otIn || null)} -{" "}
                            {formatPayrollReportLogTime(row.otOut || null)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold whitespace-nowrap text-apple-charcoal">
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
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider whitespace-nowrap text-apple-steel">
                        Date
                      </th>
                      <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider whitespace-nowrap text-apple-steel">
                        Hours
                      </th>
                      <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider whitespace-nowrap text-apple-steel">
                        Paid
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-apple-mist">
                    {modalData.scopedDailyTotals.length > 0 ? (
                      modalData.scopedDailyTotals.map((row) => (
                        <tr key={row.id}>
                          <td className="px-3 py-2 whitespace-nowrap text-apple-smoke">
                            {formatPayrollReportLogDate(row.payout_date)}
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap text-apple-smoke">
                            {(row.hours_worked ?? 0).toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold whitespace-nowrap text-apple-charcoal">
                            {formatPayrollReportPeso(row.total_pay ?? 0)}
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
      </div>
    </div>
  );
}
