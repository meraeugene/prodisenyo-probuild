"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  extractSiteName,
  formatLogTime as formatPayrollLogTime,
  toWeekLabel,
} from "@/features/payroll/utils/payrollFormatters";
import type { EmployeeLogsModalState } from "@/features/payroll/utils/payrollApprovalQueueHelpers";

interface PayrollApprovalEmployeeLogsModalProps {
  modalState: EmployeeLogsModalState;
  onClose: () => void;
}

export default function PayrollApprovalEmployeeLogsModal({
  modalState,
  onClose,
}: PayrollApprovalEmployeeLogsModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-0 backdrop-blur-sm sm:p-3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none bg-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:h-auto sm:max-h-[92vh] sm:max-w-[min(1180px,96vw)] sm:rounded-[28px]">
        <div className="border-b border-emerald-950/10 bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] text-white sm:px-6 sm:py-5">
          <div className="relative flex items-start gap-4 pr-12">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                Employee Logs
              </p>
              <h2 className="mt-2 truncate text-2xl font-semibold tracking-[-0.03em]">
                {modalState.employeeLabel}
              </h2>
              <p className="mt-2  text-sm text-white/80">
                {modalState.siteLabel} | {modalState.periodLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-0 top-0 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 p-0 text-white transition hover:bg-white/20"
              aria-label="Close employee logs modal"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          {modalState.loading ? (
            <div className="animate-pulse space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 rounded-2xl bg-[rgb(var(--apple-snow))]"
                  />
                ))}
              </div>
              <div className="overflow-hidden rounded-2xl border border-apple-mist bg-white">
                <div className="border-b border-apple-mist px-4 py-4">
                  <div className="h-4 w-40 rounded-full bg-apple-mist" />
                </div>
                <div className="space-y-2 px-4 py-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-10 rounded-xl bg-[rgb(var(--apple-snow))]"
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : modalState.error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-700">
                {modalState.error}
              </p>
            </div>
          ) : modalState.requestDailyLogs.length === 0 ? (
            <div className="rounded-2xl border border-apple-mist bg-[rgb(var(--apple-snow))] p-5 text-sm text-apple-steel">
              No attendance logs found for this employee in the linked import.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-apple-mist bg-white">
              <div className="border-b border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-apple-steel">
                  All Report Logs
                </p>
              </div>

              <div className="overflow-x-auto sm:max-h-[62vh] sm:overflow-auto">
                <table className="min-w-[760px] w-full text-xs">
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
                      ].map((header) => (
                        <th
                          key={header}
                          className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-apple-steel ${
                            header === "Hours" ? "text-right" : "text-left"
                          }`}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modalState.requestDailyLogs.map((log, index) => (
                      <tr
                        key={`${modalState.requestId}-${log.date}-${index}`}
                        className="border-b border-apple-mist/60 text-apple-charcoal last:border-0 odd:bg-apple-snow/30"
                      >
                        <td className="px-3 py-2.5 font-medium">
                          {toWeekLabel(log.date)}
                        </td>
                        <td className="px-3 py-2.5 text-apple-smoke">
                          {extractSiteName(log.site) || "-"}
                        </td>
                        <td className="px-3 py-2.5">
                          {log.time1In ? (
                            formatPayrollLogTime(log.time1In)
                          ) : (
                            <span className="text-red-500">Missed</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {log.time1Out ? (
                            formatPayrollLogTime(log.time1Out)
                          ) : (
                            <span className="text-red-500">Missed</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {log.time2In ? (
                            formatPayrollLogTime(log.time2In)
                          ) : (
                            <span className="text-red-500">Missed</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {log.time2Out ? (
                            formatPayrollLogTime(log.time2Out)
                          ) : (
                            <span className="text-red-500">Missed</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {log.otIn ? formatPayrollLogTime(log.otIn) : "-"}
                        </td>
                        <td className="px-3 py-2.5">
                          {log.otOut ? formatPayrollLogTime(log.otOut) : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold">
                          {log.hours.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
