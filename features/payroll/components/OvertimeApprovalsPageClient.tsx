"use client";

import { useState } from "react";
import WorkspaceTabSwitch from "@/components/workspace/WorkspaceTabSwitch";
import OvertimeRequestApprovalQueue from "@/features/payroll/components/OvertimeRequestApprovalQueue";
import PayrollApprovalQueue from "@/features/payroll/components/PayrollApprovalQueue";
import type { OvertimeRequestRecord } from "@/features/overtime-requests/types";
import type { PendingOvertimeRequest } from "@/features/payroll/utils/payrollApprovalQueueHelpers";
import OvertimeApprovalsHero from "./OvertimeApprovalsHero";

export default function OvertimeApprovalsPageClient({
  initialRequests,
  initialOvertimeRequests,
}: {
  initialRequests: PendingOvertimeRequest[];
  initialOvertimeRequests: OvertimeRequestRecord[];
}) {
  const [tab, setTab] = useState<"payroll" | "staff">("payroll");
  const [payrollPending, setPayrollPending] = useState(
    () => initialRequests.filter((request) => request.status === "pending").length,
  );
  const [staffPending, setStaffPending] = useState(
    () => initialOvertimeRequests.filter((request) => request.status === "pending").length,
  );

  return (
    <div className="min-h-full bg-[#f5f6f8] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1560px] space-y-4">
        <OvertimeApprovalsHero pending={payrollPending + staffPending} />

        <WorkspaceTabSwitch mode="panel" label="Overtime approval queues" idPrefix="overtime-queue-tab"
          panelId="overtime-queue-panel" value={tab} onChange={setTab} items={[
            { value: "payroll", label: "Payroll adjustments", count: payrollPending },
            { value: "staff", label: "Staff requests", count: staffPending },
          ]} />
        <div id="overtime-queue-panel" role="tabpanel" aria-labelledby={`overtime-queue-tab-${tab}`} className="min-w-0">
          <div hidden={tab !== "payroll"} className="min-w-0">
            <PayrollApprovalQueue role="ceo" initialRequests={initialRequests} onPendingCountChange={setPayrollPending} />
          </div>
          <div hidden={tab !== "staff"} className="min-w-0">
            <OvertimeRequestApprovalQueue
              initialRequests={initialOvertimeRequests}
              onPendingCountChange={setStaffPending}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
