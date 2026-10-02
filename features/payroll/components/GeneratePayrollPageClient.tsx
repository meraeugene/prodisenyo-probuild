"use client";

import { usePayrollManagerNotifications } from "../hooks/usePayrollManagerNotifications";
import { usePayrollWorkspaceSelection } from "../hooks/usePayrollWorkspaceSelection";
import PayrollWorkflowNavigation from "./generate-payroll/PayrollWorkflowNavigation";
import GeneratePayrollSkeleton from "./generate-payroll/GeneratePayrollSkeleton";
import PayrollDraftLoadError from "./generate-payroll/PayrollDraftLoadError";

import PayrollSubmitConfirmation from "@/features/payroll/components/generate-payroll/PayrollSubmitConfirmation";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

import { toast } from "sonner";
import { savePayrollRunAction } from "@/actions/payroll";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import PayrollApprovalQueue from "@/features/payroll/components/PayrollApprovalQueue";
import OvertimeRejectedAlertModal from "@/features/payroll/components/OvertimeRejectedAlertModal";
import PayrollRejectedAlertModal from "@/features/payroll/components/PayrollRejectedAlertModal";
import PayrollSection from "@/features/payroll/components/PayrollSection";
import { useAppState } from "@/features/app/AppStateProvider";

import type { AppRole } from "@/types/database";

export default function PayrollPage() {
  const {
    hydrated,
    attendance,
    payroll,
    site,
    attendancePeriod,
    currentAttendanceImportId,
    currentPayrollRunId,
    currentPayrollRunStatus,
    setCurrentPayrollRunMeta,
    selectAttendanceWorkspace,
    handleGeneratePayroll,
  } = useAppState();
  const [role, setRole] = useState<AppRole | null>(null);
  const searchParams = useSearchParams();
  const draftSelection = usePayrollWorkspaceSelection({ hydrated, importId: searchParams.get("importId"), runId: searchParams.get("runId"), selectAttendanceWorkspace });
  const { rejectionAlert, setRejectionAlert, overtimeRejectionAlert, setOvertimeRejectionAlert } = usePayrollManagerNotifications({ role, currentPayrollRunId, setCurrentPayrollRunMeta });

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

  function executeSavePayroll(intent: "draft" | "submit") {
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
          intent,
        });

        setCurrentPayrollRunMeta({
          id: result.runId,
          status: result.status,
        });
        toast.success(
          intent === "draft"
            ? "Payroll draft saved. You can continue it from the payroll dashboard."
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
            : intent === "draft"
              ? "Unable to save payroll draft."
              : "Unable to submit payroll report.",
        );
      }
    });
  }

  function handleSubmitPayroll() {
    if (role === "payroll_manager") {
      setShowSaveConfirm(true);
      return;
    }

    executeSavePayroll("submit");
  }

  if (draftSelection.isOpeningDraft || payroll.isRestoringSavedDraft) return <GeneratePayrollSkeleton />;

  const draftError = draftSelection.error || payroll.savedDraftLoadError;
  if (draftError) return <PayrollDraftLoadError message={draftError} onRetry={draftSelection.error ? draftSelection.retry : payroll.retrySavedDraftRestore} />;

  return (
    <div className="p-0">
      <PayrollWorkflowNavigation current={3} canReview={!draftSelection.isOpeningDraft && attendance.dailyRows.length > 0} />
      <PayrollSection
        dailyRowsCount={attendance.dailyRows.length}
        availableSites={attendance.availableSites}
        payroll={payroll}
        onGeneratePreview={handleGeneratePreview}
        onSaveDraft={() => executeSavePayroll("draft")}
        onSubmitPayroll={handleSubmitPayroll}
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

      {showSaveConfirm && <PayrollSubmitConfirmation site={site} attendancePeriod={attendancePeriod} isPending={isPending} onClose={() => setShowSaveConfirm(false)} onConfirm={() => { setShowSaveConfirm(false); executeSavePayroll("submit"); }} />}

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
