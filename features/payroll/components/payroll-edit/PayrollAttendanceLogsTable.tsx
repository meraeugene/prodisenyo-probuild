"use client";

import { useState } from "react";
import { PayrollDetailPagination } from "./PayrollDetailPagination";

import type { DailyLogRow } from "@/types";
import {
  extractSiteName,
  formatLogTime,
  formatPayrollNumber,
  toWeekLabel,
} from "@/features/payroll/utils/payrollFormatters";
import { round2 } from "@/features/payroll/utils/payrollEditModalHelpers";
import { buildPayrollLogBiometricBreakdown } from "@/features/payroll/utils/payrollLogHours";
import {
  getPayrollLogStatus,
  getPayrollLogTimeIn,
  getPayrollLogTimeOut,
} from "@/features/payroll/utils/payrollCalculationPresentation";

interface PayrollAttendanceLogsTableProps {
  logs: DailyLogRow[];
  visibleLogs: DailyLogRow[];
  page: number;
  totalPages: number;
  showAllLogs: boolean;
  paidHolidayDates: Set<string>;
  getRegularHours: (log: DailyLogRow) => number;
  getOvertimeHours: (log: DailyLogRow) => number;
  onUpdateHour: (
    log: DailyLogRow,
    field: "regularHours" | "overtimeHours",
    value: string,
  ) => void;
  onPageChange: (page: number) => void;
  onToggleAllLogs: () => void;
}

export function PayrollAttendanceLogsTable(
  props: PayrollAttendanceLogsTableProps,
) {
  const [selectedPage, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(props.logs.length / 5));
  const page = Math.min(selectedPage, totalPages);
  const visibleLogs = props.logs.slice((page - 1) * 5, page * 5);
  return (
    <section className="min-w-0">
      <div className="flex min-h-11 items-center justify-between gap-3 border-b border-slate-200 px-3.5">
        <div className="flex items-center gap-2">
          <div>
            <h3 className="text-[13px] font-semibold text-slate-950">Attendance Logs</h3>
            <p className="text-[13px] text-slate-400">Biometric time and editable payable hours</p>
          </div>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[13px] font-medium text-slate-500">
          {props.logs.length} record{props.logs.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="min-w-0">
        <table className="w-full text-[13px]">
          <thead className="bg-slate-50 text-[13px] uppercase tracking-[0.08em] text-slate-500">
            <tr>
              {[
                "Date",
                "Site",
                "Time In – Out",
                "Worked",
                "Lunch",
                "Regular",
                "OT",
                "Payable",
                "Status",
              ].map((label) => (
                <th key={label} className="px-3 py-2 text-left font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.logs.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-[13px] text-slate-500">
                  No attendance logs found.
                </td>
              </tr>
            ) : (
              visibleLogs.map((log, index) => {
                const regular = props.getRegularHours(log);
                const overtime = props.getOvertimeHours(log);
                const status = getPayrollLogStatus(
                  regular,
                  overtime,
                  props.paidHolidayDates.has(log.date),
                );
                const biometric = buildPayrollLogBiometricBreakdown(log);
                const timeIn = getPayrollLogTimeIn(log);
                const timeOut = getPayrollLogTimeOut(log);
                const sitePath = (log.sitePath?.length ? log.sitePath : [log.site])
                  .map(extractSiteName)
                  .filter(Boolean);
                const isMultiBranch = new Set(sitePath).size > 1;

                return (
                  <tr
                    key={`${log.date}-${log.employee}-${index}`}
                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                  >
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-800">
                      {toWeekLabel(log.date)}
                    </td>
                    <td className="max-w-56 px-3 py-2 text-slate-500">
                      {isMultiBranch ? (
                        <>
                          <span className="inline-flex rounded bg-amber-50 px-1.5 py-0.5 text-[13px] font-medium text-amber-700">MULTI BRANCH</span>
                          <span className="mt-1 block break-words text-[13px]">{sitePath.join(" -> ")}</span>
                        </>
                      ) : sitePath[0] || "-"}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-[13px] text-slate-700">
                      {timeIn ? formatLogTime(timeIn) : "-"}
                      {timeIn && log.timeInSite ? <span className="ml-1 text-[13px] text-slate-400">({extractSiteName(log.timeInSite)})</span> : null}
                      <span className="mx-1.5 text-slate-300">–</span>
                      {timeOut ? formatLogTime(timeOut) : "-"}
                      {timeOut && log.timeOutSite ? <span className="ml-1 text-[13px] text-slate-400">({extractSiteName(log.timeOutSite)})</span> : null}
                    </td>
                    <td className="px-3 py-2 tabular-nums font-medium text-slate-800">
                      {formatPayrollNumber(biometric.workedHours)}
                    </td>
                    <td className="px-3 py-2 tabular-nums font-medium text-amber-700">
                      -{formatPayrollNumber(biometric.lunchDeductionHours)}
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        aria-label={`Regular hours for ${log.date}`}
                        type="number"
                        min={0}
                        max={16}
                        step="0.01"
                        value={formatPayrollNumber(regular)}
                        onChange={(event) =>
                          props.onUpdateHour(log, "regularHours", event.target.value)
                        }
                        className="h-9 w-[58px] rounded-md border border-slate-200 bg-white px-1.5 text-right tabular-nums text-[13px] font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        aria-label={`Overtime hours for ${log.date}`}
                        type="number"
                        min={0}
                        step="0.01"
                        value={formatPayrollNumber(overtime)}
                        onChange={(event) =>
                          props.onUpdateHour(log, "overtimeHours", event.target.value)
                        }
                        className="h-9 w-[58px] rounded-md border border-slate-200 bg-white px-1.5 text-right tabular-nums text-[13px] font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      />
                    </td>
                    <td className="px-3 py-2 tabular-nums font-medium text-slate-950">
                      {formatPayrollNumber(round2(regular + overtime))}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[13px] font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PayrollDetailPagination page={page} totalPages={totalPages} onChange={setPage} />
    </section>
  );
}
