"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Settings2, UserRound, X } from "lucide-react";
import {
  ATTENDANCE_CLASSIFICATIONS,
  type AttendanceClassification,
  type PayrollAttendanceDecision,
} from "@/features/payroll/types";
import {
  decimalHoursToSeconds,
  secondsToDecimalHours,
  type CutoffAttendanceDay,
  validateAttendanceDecision,
} from "@/features/payroll/utils/payrollAttendanceEngine";
import { AttendancePunchEvidence } from "@/features/payroll/components/payroll-edit/AttendancePunchEvidence";

interface AttendanceResolutionDialogProps {
  day: CutoffAttendanceDay | null;
  employeeName: string;
  siteLabel: string;
  onClose: () => void;
  onSave: (decision: PayrollAttendanceDecision) => void;
}

export function AttendanceResolutionDialog({
  day,
  employeeName,
  siteLabel,
  onClose,
  onSave,
}: AttendanceResolutionDialogProps) {
  const [classification, setClassification] =
    useState<AttendanceClassification>("MANUAL_ATTENDANCE");
  const [regularHours, setRegularHours] = useState("8");
  const [overtimeHours, setOvertimeHours] = useState("0");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!day) return;
    setClassification(
      day.classification === "NO_BIOMETRIC"
        ? "MANUAL_ATTENDANCE"
        : day.classification,
    );
    setRegularHours(
      String(secondsToDecimalHours(day.approvedRegularSeconds || 8 * 3600)),
    );
    setOvertimeHours(
      String(secondsToDecimalHours(day.approvedOvertimeSeconds)),
    );
    setReason(day.overrideReason ?? "");
    setError(null);
  }, [day]);

  useEffect(() => {
    if (!day) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [day, onClose]);

  if (!day) return null;

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${day.date}T00:00:00`));

  function submit() {
    if (!day) return;
    const approvedRegularSeconds = decimalHoursToSeconds(Number(regularHours));
    const approvedOvertimeSeconds = decimalHoursToSeconds(Number(overtimeHours));

    try {
      validateAttendanceDecision(
        classification,
        approvedRegularSeconds,
        reason,
      );
      onSave({
        date: day.date,
        classification,
        approvedRegularSeconds,
        approvedOvertimeSeconds,
        overtimeStatus: approvedOvertimeSeconds > 0 ? "approved" : "rejected",
        reason: reason.trim(),
        source: "manual",
        reviewedAt: new Date().toISOString(),
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save attendance review.",
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-0 backdrop-blur-[3px] sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden border border-slate-200 bg-[#fbfcfc] shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-[1220px] sm:rounded-2xl">
        <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_510px_auto] lg:items-center">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700">
                Attendance Resolution
              </p>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                {day.needsReview ? "Resolve Attendance" : "Review Attendance"}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Review biometric attendance for this employee on {formattedDate}.
              </p>
            </div>
            <div className="col-span-2 row-start-2 grid gap-2 sm:grid-cols-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
              <div className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-700">
                  <UserRound size={17} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">
                    {employeeName}
                  </p>
                  <p className="truncate text-[10px] text-slate-500">
                    {siteLabel || "No site recorded"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                <CalendarDays size={17} className="shrink-0 text-teal-700" />
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {formattedDate}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Raw biometric:{" "}
                    {secondsToDecimalHours(day.biometricWorkedSeconds)} hrs
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close attendance review"
              className="col-start-2 row-start-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 lg:col-start-3"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.82fr)]">
            <AttendancePunchEvidence day={day} />

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-50 text-teal-700">
                  <Settings2 size={17} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-950">
                    Classification and Approval
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Set the classification and approved hours for this date.
                  </p>
                </div>
              </div>
              <div className="mt-3 grid gap-3">
                <label className="text-xs font-semibold text-slate-700">
                  Classification
                  <select
                    value={classification}
                    onChange={(event) => {
                      setClassification(
                        event.target.value as AttendanceClassification,
                      );
                      setError(null);
                    }}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  >
                    {ATTENDANCE_CLASSIFICATIONS.map((value) => (
                      <option key={value} value={value}>
                        {value.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-slate-700">
                    Approved regular hours
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={regularHours}
                      onChange={(event) => {
                        setRegularHours(event.target.value);
                        setError(null);
                      }}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-mono font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Approved OT hours
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={overtimeHours}
                      onChange={(event) => {
                        setOvertimeHours(event.target.value);
                        setError(null);
                      }}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-mono font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    />
                  </label>
                </div>
                <label className="text-xs font-semibold text-slate-700">
                  Reason{" "}
                  <span className="font-normal text-slate-400">
                    {classification === "WORKED" ? "(Optional)" : ""}
                  </span>
                  <textarea
                    value={reason}
                    onChange={(event) => {
                      setReason(event.target.value);
                      setError(null);
                    }}
                    rows={7}
                    placeholder="Add the review reason or payroll note"
                    className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
                {error ? (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {error}
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="h-9 rounded-lg bg-teal-700 px-4 text-xs font-bold text-white transition hover:bg-teal-800"
          >
            {day.needsReview ? "Save Resolution" : "Save Review"}
          </button>
        </footer>
      </div>
    </div>
  );
}
