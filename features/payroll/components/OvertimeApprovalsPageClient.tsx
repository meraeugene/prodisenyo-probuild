"use client";

import { Radio } from "lucide-react";
import DashboardPageHero from "@/components/DashboardPageHero";
import PayrollApprovalQueue from "@/features/payroll/components/PayrollApprovalQueue";
import type { PendingOvertimeRequest } from "@/features/payroll/utils/payrollApprovalQueueHelpers";

export default function OvertimeApprovalsPageClient({
  initialRequests,
}: {
  initialRequests: PendingOvertimeRequest[];
}) {
  return (
    <div className="space-y-4 p-6">
      <DashboardPageHero
        eyebrow="CEO Review"
        title="Overtime Approvals"
        description="Review overtime requests submitted from saved HR payroll runs and keep approval history tied to the correct pay period."
        actions={
          <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700">
            <Radio size={14} className="animate-pulse" />
            Live data
          </div>
        }
      />

      <PayrollApprovalQueue role="ceo" initialRequests={initialRequests} />
    </div>
  );
}
