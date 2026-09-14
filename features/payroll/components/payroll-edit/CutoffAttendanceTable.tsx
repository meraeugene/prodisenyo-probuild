"use client";

import { CalendarDays } from "lucide-react";
import type { CutoffAttendanceDay } from "@/features/payroll/utils/payrollAttendanceEngine";
import { secondsToDecimalHours } from "@/features/payroll/utils/payrollAttendanceEngine";
import {
  extractSiteName,
  formatLogTime,
  toWeekLabel,
} from "@/features/payroll/utils/payrollFormatters";

interface CutoffAttendanceTableProps {
  days: CutoffAttendanceDay[];
  onResolve: (day: CutoffAttendanceDay) => void;
}

const badgeStyles: Record<string, string> = {
  WORKED: "bg-teal-50 text-teal-700",
  REGULAR_HOLIDAY: "bg-violet-50 text-violet-700",
  SPECIAL_NON_WORKING_HOLIDAY: "bg-violet-50 text-violet-700",
  REST_DAY: "bg-sky-50 text-sky-700",
  NO_BIOMETRIC: "bg-amber-50 text-amber-700",
  ABSENT: "bg-red-50 text-red-600",
};

function isSunday(date: string): boolean {
  const parsed = new Date(`${date}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.getDay() === 0;
}

function PunchPair({
  timeIn,
  timeOut,
  timeInSite,
  timeOutSite,
}: {
  timeIn: string | null;
  timeOut: string | null;
  timeInSite?: string | null;
  timeOutSite?: string | null;
}) {
  const inSite = timeInSite ? extractSiteName(timeInSite) : "";
  const outSite = timeOutSite ? extractSiteName(timeOutSite) : "";

  return (
    <span className="inline-flex items-center whitespace-nowrap">
      <span>{timeIn ? formatLogTime(timeIn) : "-"}</span>
      {timeIn && inSite ? (
        <span className="ml-1 text-[9px] text-slate-400">({inSite})</span>
      ) : null}
      <span className="mx-1.5 text-slate-300"></span>
      <span>{timeOut ? formatLogTime(timeOut) : "-"}</span>
      {timeOut && outSite ? (
        <span className="ml-1 text-[9px] text-slate-400">({outSite})</span>
      ) : null}
    </span>
  );
}

export function CutoffAttendanceTable({ days, onResolve }: CutoffAttendanceTableProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-11 items-center justify-between border-b border-slate-200 px-3.5">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-teal-700" />
          <div>
            <h3 className="text-xs font-bold text-slate-950">Cutoff Attendance</h3>
            <p className="text-[10px] text-slate-400">Every date in the payroll cutoff</p>
          </div>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">{days.length} dates</span>
      </div>
      <div className="max-h-[440px] overflow-auto">
        <table className="w-full min-w-[900px] text-xs">
          <thead className="sticky top-0 z-10 bg-slate-50 text-[9px] uppercase tracking-[0.08em] text-slate-500">
            <tr>
              {['Date/Week', 'Time In - Out', 'OT In - Out', 'Raw', 'Classification', 'Regular', 'Payable', 'Action'].map((label) => (
                <th key={label} className="px-3 py-2 text-left font-semibold">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const sunday = isSunday(day.date);

              return (
                <tr key={day.date} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-800">
                    <time dateTime={day.date} title={day.date}>{toWeekLabel(day.date)}</time>
                  </td>
                  {sunday ? (
                    Array.from({ length: 7 }, (_, index) => (
                      <td key={index} className="px-3 py-2 font-mono text-slate-400">--</td>
                    ))
                  ) : (
                    <>
                      <td className="px-3 py-2 font-mono text-[10px] text-slate-600">
                        <PunchPair
                          timeIn={day.biometricTimeIn}
                          timeOut={day.biometricTimeOut}
                          timeInSite={day.biometricTime1InSite ?? day.biometricTime2InSite}
                          timeOutSite={day.biometricTime2OutSite ?? day.biometricTime1OutSite}
                        />
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] text-slate-600">
                        <PunchPair
                          timeIn={day.biometricOtIn}
                          timeOut={day.biometricOtOut}
                          timeInSite={day.biometricOtInSite}
                          timeOutSite={day.biometricOtOutSite}
                        />
                        {day.approvedOvertimeSeconds > 0 ? (
                          <span className="mt-0.5 block text-[9px] font-semibold text-teal-700">
                            {secondsToDecimalHours(day.approvedOvertimeSeconds)} hrs approved
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 font-mono">{secondsToDecimalHours(day.biometricWorkedSeconds)}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-md px-2 py-1 text-[9px] font-bold ${badgeStyles[day.classification] ?? 'bg-slate-100 text-slate-700'}`}>
                          {day.classification.replaceAll('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono">{secondsToDecimalHours(day.approvedRegularSeconds)}</td>
                      <td className="px-3 py-2 font-mono font-bold">{secondsToDecimalHours(day.payableSeconds)}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => onResolve(day)} className="h-7 rounded-md border border-teal-200 px-2.5 text-[10px] font-bold text-teal-700 hover:bg-teal-50">
                          {day.needsReview ? 'Resolve' : 'Review'}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
