"use client";

import { useEffect, useState, useTransition } from "react";
import { BadgeCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { savePayrollRunAction } from "@/actions/payroll";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import PayrollApprovalQueue from "@/features/payroll/components/PayrollApprovalQueue";
import PayrollSection from "@/features/payroll/components/PayrollSection";
import { useAppState } from "@/features/app/AppStateProvider";

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
  const [role, setRole] = useState<"ceo" | "payroll_manager" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

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
        role: "ceo" | "payroll_manager";
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
            ? "Payroll report updated. Pending overtime stays in the CEO queue."
            : "Payroll report submitted and tracked for this pay period.",
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
    <div>
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
                    and store the current payroll details for this period.
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
                  This submits the payroll report and keeps it available in the
                  CEO report center. Only overtime requests continue through the
                  separate approval flow.
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
    </div>
  );
}
