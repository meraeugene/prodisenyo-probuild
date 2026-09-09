"use client";

import OvertimeRequestApprovalQueue from "@/features/payroll/components/OvertimeRequestApprovalQueue";
import PayrollApprovalQueue from "@/features/payroll/components/PayrollApprovalQueue";
import type { OvertimeRequestRecord } from "@/features/overtime-requests/types";
import type { PendingOvertimeRequest } from "@/features/payroll/utils/payrollApprovalQueueHelpers";
import OvertimeApprovalsHero from "./OvertimeApprovalsHero";
import OvertimeApprovalSummary from "./OvertimeApprovalSummary";

export default function OvertimeApprovalsPageClient({
  initialRequests,
  initialOvertimeRequests,
}: {
  initialRequests: PendingOvertimeRequest[];
  initialOvertimeRequests: OvertimeRequestRecord[];
}) {
  const pending =
    initialRequests.filter((request) => request.status === "pending").length +
    initialOvertimeRequests.filter((request) => request.status === "pending")
      .length;

  return (
    <div className="min-h-full bg-white p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1560px] space-y-4">
        <OvertimeApprovalsHero pending={pending} />
        <OvertimeApprovalSummary
          payrollRequests={initialRequests}
          staffRequests={initialOvertimeRequests}
        />

        <div className="grid items-start gap-5 pt-1 xl:grid-cols-2">
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
    </div>
  );
}
