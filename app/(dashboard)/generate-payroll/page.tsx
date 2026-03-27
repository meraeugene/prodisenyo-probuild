"use client";

import { useEffect, useState, useTransition } from "react";
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
      const profile = (data ?? null) as { role: "ceo" | "payroll_manager" } | null;

      if (cancelled) return;
      setRole(profile?.role ?? null);
    }

    void loadRole();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleGeneratePreview() {
    const generated = handleGeneratePayroll();
    if (!generated && payroll.payrollRows.length === 0) {
      toast.error("No attendance rows are ready for payroll preview.");
      return;
    }

    toast.success("Payroll preview generated. Review it, then save the payroll run.");
  }

  function handleSavePayroll() {
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
          payrollRows: payroll.payrollRows,
          payrollOverrides: payroll.payrollOverrides,
        });

        setCurrentPayrollRunMeta({
          id: result.runId,
          status: result.status,
        });
        toast.success(
          currentPayrollRunId
            ? "Payroll changes saved. Pending overtime stays in the CEO queue."
            : "Payroll saved and tracked for this pay period.",
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
          error instanceof Error ? error.message : "Unable to save payroll.",
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <DashboardPageHero
        eyebrow="Payroll"
        title="Generate Payroll"
        description="Review grouped employee rows, manage paid holidays and rates, then export the finished payroll report."
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
          if (runId === currentPayrollRunId && currentPayrollRunStatus) {
            setCurrentPayrollRunMeta({ id: runId, status: currentPayrollRunStatus });
          }
        }}
      />
    </div>
  );
}
