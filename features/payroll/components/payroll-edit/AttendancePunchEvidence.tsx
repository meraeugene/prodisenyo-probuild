"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Link2,
  MapPin,
  ScanLine,
} from "lucide-react";
import type { CutoffAttendanceDay } from "@/features/payroll/utils/payrollAttendanceEngine";
import { secondsToDecimalHours } from "@/features/payroll/utils/payrollAttendanceEngine";
import {
  extractSiteName,
  formatLogTime,
} from "@/features/payroll/utils/payrollFormatters";

interface AttendancePunchEvidenceProps {
  day: CutoffAttendanceDay;
}

function PunchValue({
  value,
  site,
}: {
  value: string | null;
  site: string | null;
}) {
  const siteLabel = site ? extractSiteName(site) : "";

  if (!value) {
    return <span className="font-medium text-slate-400">-</span>;
  }

  return (
    <span className="block">
      <span className="font-mono text-sm font-bold text-slate-900">
        {formatLogTime(value)}
      </span>
      {siteLabel ? (
        <span className="mt-0.5 block text-[10px] text-slate-500">
          {siteLabel}
        </span>
      ) : null}
    </span>
  );
}

function PunchStatus({
  timeIn,
  timeOut,
}: {
  timeIn: string | null;
  timeOut: string | null;
}) {
  const complete = Boolean(timeIn && timeOut);
  return (
    <span
      className={
        complete
          ? "inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-1 text-[10px] font-bold text-teal-700"
          : "inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600"
      }
    >
      {complete ? <CheckCircle2 size={11} /> : <CircleAlert size={11} />}
      {complete ? "Complete" : "Missing"}
    </span>
  );
}

export function AttendancePunchEvidence({
  day,
}: AttendancePunchEvidenceProps) {
  const sitePath = [
    ...new Set(day.biometricSitePath.map(extractSiteName).filter(Boolean)),
  ];
  const aliases = [...new Set(day.rawBiometricNames.filter(Boolean))];
  const punchRows = [
    {
      label: "Time 1",
      timeIn: day.biometricTime1In,
      timeOut: day.biometricTime1Out,
      timeInSite: day.biometricTime1InSite,
      timeOutSite: day.biometricTime1OutSite,
    },
    {
      label: "Time 2",
      timeIn: day.biometricTime2In,
      timeOut: day.biometricTime2Out,
      timeInSite: day.biometricTime2InSite,
      timeOutSite: day.biometricTime2OutSite,
    },
    {
      label: "Overtime",
      timeIn: day.biometricOtIn,
      timeOut: day.biometricOtOut,
      timeInSite: day.biometricOtInSite,
      timeOutSite: day.biometricOtOutSite,
    },
  ];
  const timeline = punchRows.flatMap((punch) => [
    {
      label: `${punch.label} In`,
      value: punch.timeIn,
      site: punch.timeInSite,
    },
    {
      label: `${punch.label} Out`,
      value: punch.timeOut,
      site: punch.timeOutSite,
    },
  ]);

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-50 text-teal-700">
          <ScanLine size={17} />
        </span>
        <div>
          <h4 className="text-sm font-bold text-slate-950">
            Biometric DTR Logs
          </h4>
          <p className="text-[11px] text-slate-500">
            Original Time 1, Time 2, and OT punches from the biometric files.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[680px] text-xs">
          <thead className="bg-slate-50 text-[9px] uppercase tracking-[0.08em] text-slate-500">
            <tr>
              {["Log", "Time In", "Time Out", "Site / Source", "Status"].map(
                (label) => (
                  <th
                    key={label}
                    className="px-3 py-2.5 text-left font-semibold"
                  >
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {punchRows.map((punch) => {
              const inSite = punch.timeInSite
                ? extractSiteName(punch.timeInSite)
                : "";
              const outSite = punch.timeOutSite
                ? extractSiteName(punch.timeOutSite)
                : "";
              return (
                <tr key={punch.label} className="border-t border-slate-100">
                  <td className="px-3 py-3 font-bold text-slate-800">
                    {punch.label}
                  </td>
                  <td className="px-3 py-3">
                    <PunchValue value={punch.timeIn} site={punch.timeInSite} />
                  </td>
                  <td className="px-3 py-3">
                    <PunchValue value={punch.timeOut} site={punch.timeOutSite} />
                  </td>
                  <td className="px-3 py-3 text-[10px] leading-4 text-slate-600">
                    {inSite ? <span className="block">In: {inSite}</span> : null}
                    {outSite ? (
                      <span className="block">Out: {outSite}</span>
                    ) : null}
                    {!inSite && !outSite ? "-" : null}
                  </td>
                  <td className="px-3 py-3">
                    <PunchStatus
                      timeIn={punch.timeIn}
                      timeOut={punch.timeOut}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-800">
          <Clock3 size={14} className="text-teal-700" />
          Punch Timeline
        </div>
        <div className="overflow-x-auto">
          <div className="grid min-w-[720px] grid-cols-6 gap-2">
            {timeline.map((punch) => {
              const site = punch.site ? extractSiteName(punch.site) : "";
              return (
                <div
                  key={punch.label}
                  className={
                    punch.value
                      ? "rounded-lg border border-teal-100 bg-teal-50/40 p-2.5"
                      : "rounded-lg border border-slate-200 bg-slate-50 p-2.5"
                  }
                >
                  {punch.value ? (
                    <CheckCircle2 size={14} className="text-teal-600" />
                  ) : (
                    <CircleAlert size={14} className="text-red-500" />
                  )}
                  <p className="mt-1.5 font-mono text-xs font-bold text-slate-900">
                    {punch.value ? formatLogTime(punch.value) : "Missing"}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-600">
                    {punch.label}
                  </p>
                  {site ? (
                    <p className="mt-0.5 truncate text-[9px] text-slate-400">
                      {site}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <MapPin size={13} className="text-teal-700" />
            Site Movement
          </div>
          {sitePath.length ? (
            <div className="mt-2 flex flex-wrap items-center gap-1 text-xs font-bold text-slate-800">
              {sitePath.map((site, index) => (
                <span key={site} className="inline-flex items-center gap-1">
                  {index > 0 ? (
                    <ChevronRight size={12} className="text-teal-600" />
                  ) : null}
                  {site}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-400">No site recorded</p>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <Link2 size={13} className="text-teal-700" />
            Raw Biometric Aliases
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-800">
            {aliases.length ? aliases.join(", ") : "No alias recorded"}
          </p>
        </div>
      </div>

      {day.detectedOvertimeSeconds > 0 ? (
        <div className="mt-4 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">
              Detected overtime:{" "}
              {secondsToDecimalHours(day.detectedOvertimeSeconds)} hrs
            </p>
            <p className="mt-0.5">
              Confirm the approved OT hours before saving this review.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
