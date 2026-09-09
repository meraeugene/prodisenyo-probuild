"use client";

import OvertimeRequestApprovalQueue from "@/features/payroll/components/OvertimeRequestApprovalQueue";
import PayrollApprovalQueue from "@/features/payroll/components/PayrollApprovalQueue";
import type { OvertimeRequestRecord } from "@/features/overtime-requests/types";
import type { PendingOvertimeRequest } from "@/features/payroll/utils/payrollApprovalQueueHelpers";

export default function OvertimeApprovalsPageClient({
  initialRequests,
  initialOvertimeRequests,
}: {
  initialRequests: PendingOvertimeRequest[];
  initialOvertimeRequests: OvertimeRequestRecord[];
}) {
  return (
    <div className="min-h-full space-y-7 bg-[#f6f8f8] p-4 sm:p-6 lg:p-8">
      <header className="rounded-3xl bg-[#075e5b] p-6 text-white sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">Approvals</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Overtime approvals</h1>
        <p className="mt-3 text-sm text-teal-50/80">Review hours and approve requests.</p>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div className="min-w-0">
          <PayrollApprovalQueue role="ceo" initialRequests={initialRequests} />
        </div>
        <div className="min-w-0">
          <OvertimeRequestApprovalQueue
            initialRequests={initialOvertimeRequests}
          />
        </div>
      </div>
    </div>
  );
}
