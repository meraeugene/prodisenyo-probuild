"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import PayrollApprovalEmployeeLogsModal from "@/features/payroll/components/PayrollApprovalEmployeeLogsModal";
import PayrollApprovalQueueCard from "@/features/payroll/components/PayrollApprovalQueueCard";
import { usePayrollApprovalQueue } from "@/features/payroll/hooks/usePayrollApprovalQueue";
import type { PendingOvertimeRequest } from "@/features/payroll/utils/payrollApprovalQueueHelpers";
import type { AppRole } from "@/types/database";
import { useCeoApprovalList } from "../hooks/useCeoApprovalList";
import CeoListToolbar from "@/features/ceo-workspace/components/CeoListToolbar";
import CeoListPagination from "@/features/ceo-workspace/components/CeoListPagination";
import styles from "@/features/ceo-workspace/components/ceoWorkspace.module.css";

interface PayrollApprovalQueueProps {
  role: AppRole | null;
  roleLoading?: boolean;
  initialRequests?: PendingOvertimeRequest[];
  onRequestResolved?: (runId: string | null) => void;
}

export default function PayrollApprovalQueue({
  role,
  roleLoading = false,
  initialRequests = [],
  onRequestResolved,
}: PayrollApprovalQueueProps) {
  const [rejectConfirmRequest, setRejectConfirmRequest] =
    useState<PendingOvertimeRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingRejectRequestId, setSubmittingRejectRequestId] = useState<
    string | null
  >(null);
  const state = usePayrollApprovalQueue({
    role,
    roleLoading,
    initialRequests,
    onRequestResolved,
  });
  const list = useCeoApprovalList(state.pendingRequests);

  useEffect(() => {
    if (
      submittingRejectRequestId &&
      rejectConfirmRequest &&
      state.pendingActionId !== rejectConfirmRequest.id &&
      state.pendingActionType !== "reject"
    ) {
      setRejectConfirmRequest(null);
      setRejectionReason("");
      setSubmittingRejectRequestId(null);
    }
  }, [
    submittingRejectRequestId,
    rejectConfirmRequest,
    state.pendingActionId,
    state.pendingActionType,
  ]);

  if (!roleLoading && role !== "ceo") return null;

  return (
    <section aria-label="Payroll overtime adjustments" className="flex flex-col gap-4">
      <div className={styles.panel}>
      <div className="p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Payroll adjustments
          </h2>
          <span className="inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            {state.pendingCount} pending
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Verify attendance-derived overtime before it reaches payroll.
        </p>
      </div>
      <CeoListToolbar tabs={list.tabs} tab={list.status} onTabChange={list.setStatus} query={list.query} onQueryChange={list.setQuery} searchLabel="Search payroll adjustments" placeholder="Employee, site, or period" hasFilters={list.hasFilters} onReset={list.reset} />
      </div>

      <div>
        <div className="min-w-0">
          {!list.visible.length ? (
            <p className="text-sm text-apple-steel">
              No matching payroll adjustments. Try another search or status.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {list.pagination.pageRows.map((request) => (
                <PayrollApprovalQueueCard
                  key={request.id}
                  request={request}
                  isPending={state.isPending}
                  pendingActionId={state.pendingActionId}
                  pendingActionType={state.pendingActionType}
                  logsLoading={Boolean(
                    state.employeeLogsLoadingByRequestId[request.id],
                  )}
                  onOpenLogs={state.openRequestLogs}
                  onApprove={(adjustmentId) =>
                    state.handleAction(adjustmentId, "approve")
                  }
                  onReject={(requestToReject) => {
                    setRejectConfirmRequest(requestToReject);
                    setRejectionReason("");
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={styles.panel}><CeoListPagination {...list.pagination} total={list.visible.length} noun="requests" label="Payroll adjustment list" /></div>

      {state.activeLogsModalState ? (
        <PayrollApprovalEmployeeLogsModal
          modalState={state.activeLogsModalState}
          onClose={state.closeLogsModal}
        />
      ) : null}

      {rejectConfirmRequest ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white shadow-workspace">
            <div className="border-b border-apple-mist bg-[linear-gradient(135deg,#063b38,#075f5b,#087a75)] px-5 py-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
                Return Overtime
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                Send this overtime request back to HR
              </h2>
            </div>

            <div className="space-y-4 px-5 py-5">
              <textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                rows={5}
                placeholder="Add an optional return note for HR."
                className="w-full rounded-2xl border border-apple-mist px-3 py-3 text-sm text-apple-charcoal outline-none transition focus:border-[#076d69]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectConfirmRequest(null);
                    setRejectionReason("");
                  }}
                  disabled={
                    state.pendingActionId === rejectConfirmRequest.id &&
                    state.pendingActionType === "reject"
                  }
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-apple-mist px-4 text-sm font-semibold text-apple-charcoal transition hover:border-teal-200 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    state.handleAction(
                      rejectConfirmRequest.id,
                      "reject",
                      rejectionReason,
                    );
                    setSubmittingRejectRequestId(rejectConfirmRequest.id);
                  }}
                  disabled={
                    state.pendingActionId === rejectConfirmRequest.id &&
                    state.pendingActionType === "reject"
                  }
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#527d79] px-4 text-sm font-semibold text-white transition hover:bg-[#527d79] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {state.pendingActionId === rejectConfirmRequest.id &&
                  state.pendingActionType === "reject" ? (
                    <>
                      <LoaderCircle size={15} className="mr-2 animate-spin" />
                      Returning...
                    </>
                  ) : (
                    "Confirm Return"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
