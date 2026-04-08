"use client";

import { Clock3 } from "lucide-react";
import PayrollApprovalEmployeeLogsModal from "@/features/payroll/components/PayrollApprovalEmployeeLogsModal";
import PayrollApprovalQueueCard from "@/features/payroll/components/PayrollApprovalQueueCard";
import PayrollApprovalQueueSkeleton from "@/features/payroll/components/PayrollApprovalQueueSkeleton";
import { usePayrollApprovalQueue } from "@/features/payroll/hooks/usePayrollApprovalQueue";
import type { AppRole } from "@/types/database";

interface PayrollApprovalQueueProps {
  role: AppRole | null;
  roleLoading?: boolean;
  onRequestResolved?: (runId: string | null) => void;
  refreshToken?: number;
}

export default function PayrollApprovalQueue({
  role,
  roleLoading = false,
  onRequestResolved,
  refreshToken = 0,
}: PayrollApprovalQueueProps) {
  const state = usePayrollApprovalQueue({
    role,
    roleLoading,
    onRequestResolved,
    refreshToken,
  });

  if (!roleLoading && role !== "ceo") return null;

  return (
    <section className="rounded-[14px] border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-widest text-apple-steel">
            CEO Approval Queue
          </p>
          <h2 className="mt-1 text-xl font-bold text-apple-charcoal">
            Pending Overtime Requests
          </h2>
          <p className="mt-1 text-sm text-apple-smoke">
            Review overtime requests while payroll stays saved and visible in
            history.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          <Clock3 size={14} />
          {state.pendingCount} pending
        </span>
      </div>

      <div className="mt-4">
        {state.loading ? (
          <PayrollApprovalQueueSkeleton />
        ) : !state.hasRequests ? (
          <p className="text-sm text-apple-steel">
            No overtime requests are waiting for approval.
          </p>
        ) : (
          <div className="grid items-stretch gap-3 md:grid-cols-2 ">
            {state.pendingRequests.map((request) => (
              <PayrollApprovalQueueCard
                key={request.id}
                request={request}
                isPending={state.isPending}
                pendingActionId={state.pendingActionId}
                pendingActionType={state.pendingActionType}
                logsLoading={Boolean(state.employeeLogsLoadingByRequestId[request.id])}
                onOpenLogs={state.openRequestLogs}
                onAction={state.handleAction}
              />
            ))}
          </div>
        )}
      </div>

      {state.activeLogsModalState ? (
        <PayrollApprovalEmployeeLogsModal
          modalState={state.activeLogsModalState}
          onClose={state.closeLogsModal}
        />
      ) : null}
    </section>
  );
}
