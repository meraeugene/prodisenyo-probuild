"use client";

import { Clock3, LoaderCircle } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import {
  approveOvertimeRequestFormAction,
  rejectOvertimeRequestFormAction,
} from "@/actions/payroll";
import type { OvertimeRequestRecord } from "@/features/overtime-requests/types";
import OvertimeApprovalRequestCard from "./OvertimeApprovalRequestCard";
import { useCeoApprovalList } from "../hooks/useCeoApprovalList";
import CeoListToolbar from "@/features/ceo-workspace/components/CeoListToolbar";
import CeoListPagination from "@/features/ceo-workspace/components/CeoListPagination";
import styles from "@/components/workspace/workspace.module.css";

export default function OvertimeRequestApprovalQueue({
  initialRequests,
}: {
  initialRequests: OvertimeRequestRecord[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [pendingActionType, setPendingActionType] = useState<
    "approve" | "reject" | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const sortedRequests = useMemo(
    () =>
      [...requests].sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === "pending") return -1;
          if (b.status === "pending") return 1;
        }
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }),
    [requests],
  );

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "pending").length,
    [requests],
  );
  const list = useCeoApprovalList(sortedRequests);

  function applyRequestPatch(
    requestId: string,
    patch: Partial<OvertimeRequestRecord>,
  ) {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId ? { ...request, ...patch } : request,
      ),
    );
  }

  function handleApprove(requestId: string) {
    setPendingActionId(requestId);
    setPendingActionType("approve");
    startTransition(async () => {
      try {
        const result = await approveOvertimeRequestFormAction(requestId);
        applyRequestPatch(requestId, {
          status: "approved",
          approved_at: result.approvedAt,
          rejected_at: null,
          rejection_reason: null,
        });
        window.dispatchEvent(new Event("payroll:pending-count-changed"));
      } finally {
        setPendingActionId(null);
        setPendingActionType(null);
      }
    });
  }

  function handleConfirmReject() {
    if (!rejectRequestId) return;

    setPendingActionId(rejectRequestId);
    setPendingActionType("reject");
    startTransition(async () => {
      try {
        const result = await rejectOvertimeRequestFormAction({
          requestId: rejectRequestId,
          rejectionReason,
        });
        applyRequestPatch(rejectRequestId, {
          status: "rejected",
          rejected_at: result.rejectedAt,
          rejection_reason: result.rejectionReason,
        });
        setRejectRequestId(null);
        setRejectionReason("");
        window.dispatchEvent(new Event("payroll:pending-count-changed"));
      } finally {
        setPendingActionId(null);
        setPendingActionType(null);
      }
    });
  }

  return (
    <section aria-label="Staff overtime approvals" className="flex flex-col gap-4">
      <div className={styles.panel}>
      <div className="p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Staff request forms
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <Clock3 size={14} />
            {pendingCount} pending
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Review submitted reasons, requested hours, and estimated pay.
        </p>
      </div>
      <CeoListToolbar tabs={list.tabs} tab={list.status} onTabChange={list.setStatus} query={list.query} onQueryChange={list.setQuery} searchLabel="Search staff requests" placeholder="Employee, site, or reason" hasFilters={list.hasFilters} onReset={list.reset} />
      </div>

      <div>
        <div className="space-y-4">
          {list.visible.length === 0 ? (
            <p className="text-sm text-apple-steel">
              No matching staff requests. Try another search or status.
            </p>
          ) : (
            list.pagination.pageRows.map((request) => <OvertimeApprovalRequestCard
              key={request.id} request={request} pending={isPending}
              approving={pendingActionId === request.id && pendingActionType === "approve"}
              onApprove={handleApprove}
              onReject={(id) => { setRejectRequestId(id); setRejectionReason(""); }}
            />)
          )}
        </div>
      </div>
      <div className={styles.panel}><CeoListPagination {...list.pagination} total={list.visible.length} noun="requests" label="Staff request list" /></div>

      {rejectRequestId ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white shadow-workspace">
            <div className="border-b border-apple-mist bg-[linear-gradient(135deg,#063b38,#075f5b,#087a75)] px-5 py-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
                Return Overtime Request
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                Send this request back with a reason
              </h2>
            </div>

            <div className="space-y-4 px-5 py-5">
              <textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                rows={5}
                placeholder="Add an optional return note."
                className="w-full rounded-2xl border border-apple-mist px-3 py-3 text-sm text-apple-charcoal outline-none transition focus:border-[#076d69]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectRequestId(null);
                    setRejectionReason("");
                  }}
                  disabled={isPending}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-apple-mist px-4 text-sm font-semibold text-apple-charcoal transition hover:border-teal-200 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={isPending}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#527d79] px-4 text-sm font-semibold text-white transition hover:bg-[#527d79] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendingActionId === rejectRequestId &&
                  pendingActionType === "reject" ? (
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
