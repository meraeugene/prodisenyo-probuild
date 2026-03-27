"use client";

import { useTransition } from "react";
import { DatabaseBackup } from "lucide-react";
import { toast } from "sonner";
import { savePayrollSnapshotAction } from "@/actions/payroll-history";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import type { PayrollRow } from "@/lib/payrollEngine";

interface SavePayrollRunButtonProps {
  attendancePeriod: string;
  availableSites: string[];
  payrollRows: PayrollRow[];
}

export default function SavePayrollRunButton({
  attendancePeriod,
  availableSites,
  payrollRows,
}: SavePayrollRunButtonProps) {
  const { user } = useAuthSession();
  const [isPending, startTransition] = useTransition();

  if (user.role !== "admin") {
    return null;
  }

  function handleSave() {
    startTransition(async () => {
      const result = await savePayrollSnapshotAction({
        attendancePeriod,
        availableSites,
        payrollRows,
      });

      if (!result.success) {
        toast.error("Save failed", {
          description: result.error ?? "Unable to save payroll snapshot.",
        });
        return;
      }

      toast.success("Payroll saved", {
        description: "This weekly payroll snapshot is now available in Saved Payrolls.",
      });
    });
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={isPending || payrollRows.length === 0}
      className="inline-flex items-center gap-1.5 rounded-[10px] border border-apple-mist px-3.5 py-2 text-xs font-semibold text-apple-ash transition hover:border-apple-steel disabled:cursor-not-allowed disabled:opacity-50"
    >
      <DatabaseBackup size={14} />
      {isPending ? "Saving..." : "Save to Supabase"}
    </button>
  );
}
