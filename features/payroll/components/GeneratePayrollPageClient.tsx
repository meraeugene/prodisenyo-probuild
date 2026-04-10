"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BadgeCheck, Send } from "lucide-react";
import { toast } from "sonner";
import {
  getPayrollManagerOvertimeNotificationsAction,
  getPayrollManagerReportNotificationsAction,
  savePayrollRunAction,
} from "@/actions/payroll";
import DashboardPageHero from "@/components/DashboardPageHero";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import PayrollApprovalQueue from "@/features/payroll/components/PayrollApprovalQueue";
import OvertimeRejectedAlertModal from "@/features/payroll/components/OvertimeRejectedAlertModal";
import PayrollRejectedAlertModal from "@/features/payroll/components/PayrollRejectedAlertModal";
import PayrollSection from "@/features/payroll/components/PayrollSection";
import { useAppState } from "@/features/app/AppStateProvider";
import { parseOvertimeRequestNotes } from "@/features/payroll/utils/overtimeRequestNotes";
import type { AppRole } from "@/types/database";

export default function PayrollPage() {
  const {
    attendance,
    payroll,
    site,
    attendancePeriod,
    currentAttendanceImportId,
    currentPayrollRunId,
    currentPayrollRunStatus,
    setCurrentPayrollRunMeta,
    handleGeneratePayroll,
  } = useAppState();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [rejectionAlert, setRejectionAlert] = useState<{
    reportId: string;
    siteName: string;
    periodLabel: string;
    rejectionReason: string | null;
  } | null>(null);
  const [overtimeRejectionAlert, setOvertimeRejectionAlert] = useState<{
    requestId: string;
    employeeName: string;
    siteName: string;
    periodLabel: string;
    rejectionReason: string | null;
  } | null>(null);
  const knownRejectionTimesRef = useRef<Record<string, string>>({});
  const knownOvertimeRejectionTimesRef = useRef<Record<string, string>>({});
  const canPlayNotificationSoundRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        setRole(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      const profile = (data ?? null) as {
        role: AppRole;
      } | null;

      if (cancelled) return;
      setRole(profile?.role ?? null);
    }

    void loadRole();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = showSaveConfirm ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showSaveConfirm]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.sessionStorage.getItem(
        "generate-payroll:seen-rejection-times",
      );
      if (!raw) return;

      const parsed = JSON.parse(raw) as Record<string, string>;
      knownRejectionTimesRef.current = parsed;
    } catch {
      knownRejectionTimesRef.current = {};
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.sessionStorage.getItem(
        "generate-payroll:seen-overtime-rejection-times",
      );
      if (!raw) return;

      const parsed = JSON.parse(raw) as Record<string, string>;
      knownOvertimeRejectionTimesRef.current = parsed;
    } catch {
      knownOvertimeRejectionTimesRef.current = {};
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      canPlayNotificationSoundRef.current = true;
    }, 1000);

    let cancelled = false;

    async function loadPayrollNotifications() {
      if (cancelled || document.hidden || role !== "payroll_manager") return;

      try {
        const [response, overtimeResponse] = await Promise.all([
          getPayrollManagerReportNotificationsAction(),
          getPayrollManagerOvertimeNotificationsAction(),
        ]);
        if (cancelled) return;

        const currentRunNotification = response.reports.find(
          (report) => report.id === currentPayrollRunId,
        );

        if (currentRunNotification) {
          setCurrentPayrollRunMeta({
            id: currentRunNotification.id,
            status: currentRunNotification.status,
          });
        }

        const latestFreshRejection = response.reports
          .filter((report) => report.status === "rejected" && report.rejected_at)
          .sort(
            (left, right) =>
              new Date(right.rejected_at as string).getTime() -
              new Date(left.rejected_at as string).getTime(),
          )
          .find((report) => {
            const known = knownRejectionTimesRef.current[report.id];
            return (
              !known ||
              new Date(report.rejected_at as string).getTime() > new Date(known).getTime()
            );
          });

        response.reports.forEach((report) => {
          if (report.rejected_at) {
            knownRejectionTimesRef.current[report.id] = report.rejected_at;
          }
        });

        window.sessionStorage.setItem(
          "generate-payroll:seen-rejection-times",
          JSON.stringify(knownRejectionTimesRef.current),
        );

        if (latestFreshRejection) {
          setRejectionAlert({
            reportId: latestFreshRejection.id,
            siteName: latestFreshRejection.site_name,
            periodLabel: latestFreshRejection.period_label,
            rejectionReason: latestFreshRejection.rejection_reason,
          });

          if (canPlayNotificationSoundRef.current) {
            const audio = new Audio("/sounds/overtime-approval.mp3");
            audio.volume = 0.9;
            void audio.play().catch(() => undefined);
          }
        }

        const latestFreshOvertimeRejection = overtimeResponse.requests
          .filter((request) => request.status === "rejected")
          .sort(
            (left, right) =>
              new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
          )
          .find((request) => {
            const known = knownOvertimeRejectionTimesRef.current[request.id];
            return (
              !known ||
              new Date(request.updated_at).getTime() > new Date(known).getTime()
            );
          });

        overtimeResponse.requests.forEach((request) => {
          knownOvertimeRejectionTimesRef.current[request.id] = request.updated_at;
        });

        window.sessionStorage.setItem(
          "generate-payroll:seen-overtime-rejection-times",
          JSON.stringify(knownOvertimeRejectionTimesRef.current),
        );

        if (latestFreshOvertimeRejection) {
          const parsedNotes = parseOvertimeRequestNotes(latestFreshOvertimeRejection.notes);
          setOvertimeRejectionAlert({
            requestId: latestFreshOvertimeRejection.id,
            employeeName: latestFreshOvertimeRejection.employee_name ?? "Unknown Employee",
            siteName: latestFreshOvertimeRejection.site_name ?? "",
            periodLabel: latestFreshOvertimeRejection.period_label ?? "",
            rejectionReason: parsedNotes.rejectionReason,
          });

          if (canPlayNotificationSoundRef.current) {
            const audio = new Audio("/sounds/overtime-approval.mp3");
            audio.volume = 0.9;
            void audio.play().catch(() => undefined);
          }
        }
      } catch {
        // Keep polling silent so intermittent failures do not interrupt payroll work.
      }
    }

    void loadPayrollNotifications();

    const intervalId = window.setInterval(() => {
      void loadPayrollNotifications();
    }, 30000);

    function handleWindowFocus() {
      void loadPayrollNotifications();
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        void loadPayrollNotifications();
      }
    }

    function handlePageShow() {
      void loadPayrollNotifications();
    }

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [currentPayrollRunId, role, setCurrentPayrollRunMeta]);

  function handleGeneratePreview() {
    const generated = handleGeneratePayroll();
    if (!generated && payroll.payrollRows.length === 0) {
      toast.error("No attendance rows are ready for payroll preview.");
      return;
    }

    toast.success(
      "Payroll preview generated. Review it, then submit the payroll report.",
    );
  }

  function executeSavePayroll() {
    startTransition(async () => {
      try {
        if (!payroll.payrollGenerated || payroll.payrollRows.length === 0) {
          toast.error("Generate the payroll preview first.");
          return;
        }

        const result = await savePayrollRunAction({
          attendanceImportId: currentAttendanceImportId,
          payrollRunId: currentPayrollRunId,
          siteName: site,
          attendancePeriod,
          payableHolidayDays: payroll.payableHolidayDays,
          employeeBranchRates: payroll.employeeBranchRates,
          payrollAttendanceInputs: payroll.payrollAttendanceInputs,
          payrollRows: payroll.payrollRows,
          payrollOverrides: payroll.payrollOverrides,
        });

        setCurrentPayrollRunMeta({
          id: result.runId,
          status: result.status,
        });
        toast.success(
          currentPayrollRunId
            ? "Payroll report updated and kept in the CEO review queue."
            : "Payroll report submitted for CEO review.",
        );
      } catch (error) {
        console.error("PAYROLL_SAVE_FAILED", {
          error,
          currentAttendanceImportId,
          currentPayrollRunId,
          site,
          attendancePeriod,
          payrollRowCount: payroll.payrollRows.length,
        });
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to submit payroll report.",
        );
      }
    });
  }

  function handleSavePayroll() {
    if (role === "payroll_manager") {
      setShowSaveConfirm(true);
      return;
    }

    executeSavePayroll();
  }

  return (
    <div className="p-4">
      <DashboardPageHero
        eyebrow="Payroll"
        title="Generate Payroll"
        description="Review grouped employee rows, manage paid holidays and rates, then submit the finished payroll report."
      />

      <PayrollSection
        dailyRowsCount={attendance.dailyRows.length}
        availableSites={attendance.availableSites}
        payroll={payroll}
        onGeneratePreview={handleGeneratePreview}
        onSavePayroll={handleSavePayroll}
        currentPayrollRunId={currentPayrollRunId}
        currentPayrollRunStatus={currentPayrollRunStatus}
        currentUserRole={role}
        savePending={isPending}
      />

      <PayrollApprovalQueue
        role={role}
        onRequestResolved={(runId) => {
          if (
            runId &&
            runId === currentPayrollRunId &&
            currentPayrollRunStatus
          ) {
            setCurrentPayrollRunMeta({
              id: runId,
              status: currentPayrollRunStatus,
            });
          }
        }}
      />

      {showSaveConfirm ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm ">
          <div className="w-full max-w-xl rounded-[24px] border border-apple-mist bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="border-b border-apple-mist px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#14532d,#166534)] text-white shadow-[0_12px_28px_rgba(22,101,52,0.18)]">
                  <BadgeCheck size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-apple-steel">
                    Submit Payroll Report
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-apple-charcoal">
                    Submit this payroll report for the current period?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-apple-steel">
                    This will submit the payroll report for{" "}
                    <span className="font-semibold text-apple-charcoal">
                      {site}
                    </span>{" "}
                    and place it in the CEO payroll report review queue.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="grid gap-3 rounded-[20px] border border-apple-mist bg-[linear-gradient(180deg,#fbfdfc,#f6faf8)] p-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
                    Site
                  </p>
                  <p className="mt-1 text-sm font-semibold text-apple-charcoal">
                    {site}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
                    Payroll Period
                  </p>
                  <p className="mt-1 text-sm font-semibold text-apple-charcoal">
                    {attendancePeriod}
                  </p>
                </div>
              </div>

              <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-sm leading-6 text-emerald-900">
                  This submits the payroll report as pending CEO review. It will
                  only appear in the CEO dashboard totals after the CEO accepts
                  it. Only overtime requests continue through the separate
                  approval flow.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-apple-mist px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowSaveConfirm(false);
                }}
                disabled={isPending}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-apple-silver px-4 text-sm font-semibold text-apple-ash transition hover:border-apple-charcoal disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSaveConfirm(false);
                  executeSavePayroll();
                }}
                disabled={isPending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#1f6a37] px-5 text-sm font-semibold text-white transition hover:bg-[#18552d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={15} />
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <PayrollRejectedAlertModal
        open={rejectionAlert !== null}
        siteName={rejectionAlert?.siteName ?? ""}
        periodLabel={rejectionAlert?.periodLabel ?? ""}
        rejectionReason={rejectionAlert?.rejectionReason ?? null}
        onClose={() => setRejectionAlert(null)}
      />

      <OvertimeRejectedAlertModal
        open={overtimeRejectionAlert !== null}
        employeeName={overtimeRejectionAlert?.employeeName ?? ""}
        siteName={overtimeRejectionAlert?.siteName ?? ""}
        periodLabel={overtimeRejectionAlert?.periodLabel ?? ""}
        rejectionReason={overtimeRejectionAlert?.rejectionReason ?? null}
        onClose={() => setOvertimeRejectionAlert(null)}
      />
    </div>
  );
}
