"use client";

import { CheckCircle2, Clock3, Loader2, MapPin, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseOvertimeRequestNotes } from "@/features/payroll/utils/overtimeRequestNotes";
import {
  formatMoney,
  formatRequestedAt,
  getRelationValue,
  type PendingOvertimeRequest,
} from "@/features/payroll/utils/payrollApprovalQueueHelpers";

interface PayrollApprovalQueueCardProps {
  request: PendingOvertimeRequest;
  isPending: boolean;
  pendingActionId: string | null;
  pendingActionType: "approve" | "reject" | null;
  logsLoading: boolean;
  onOpenLogs: (request: PendingOvertimeRequest) => void;
  onApprove: (adjustmentId: string) => void;
  onReject: (request: PendingOvertimeRequest) => void;
}

export default function PayrollApprovalQueueCard({
  request,
  isPending,
  pendingActionId,
  pendingActionType,
  logsLoading,
  onOpenLogs,
  onApprove,
  onReject,
}: PayrollApprovalQueueCardProps) {
  const run = getRelationValue(request.payroll_runs);
  const rowBusy = isPending && pendingActionId === request.id;
  const isResolved = request.status !== "pending";
  const rejectBusy = rowBusy && pendingActionType === "reject";
  const approveBusy = rowBusy && pendingActionType === "approve";
  const siteLabel =
    run?.site_name?.trim() || request.site_name?.trim() || "Unknown Site";
  const employeeLabel = request.employee_name ?? "Unknown Employee";
  const periodLabel =
    run?.period_label ?? request.period_label ?? "Unknown Period";
  const notes = parseOvertimeRequestNotes(request.notes).displayNotes;

  return (
    <div className="group flex w-full min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_-25px_rgba(15,23,42,.25)]">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-[15px] font-bold tracking-tight text-apple-charcoal">
            {employeeLabel}
          </h3>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset",
              request.status === "approved"
                ? "bg-teal-50 text-teal-700 ring-teal-200/40"
                : request.status === "rejected"
                  ? "bg-[#f0fdfa] text-[#0f766e] ring-[#ccfbf1]"
                  : "bg-amber-50 text-amber-700 ring-amber-200/40",
            )}
          >
            {request.status === "approved" ? (
              <>
                <CheckCircle2 size={12} strokeWidth={2.5} />
                Approved
              </>
            ) : request.status === "rejected" ? (
              <>
                <XCircle size={12} strokeWidth={2.5} />
                Returned
              </>
            ) : (
              <>
                <Clock3 size={12} strokeWidth={2.5} />
                Pending Approval
              </>
            )}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-apple-steel">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-apple-smoke" />
            {siteLabel}
          </div>
          <div className="hidden h-3 w-px bg-apple-mist lg:block" />
          <div className="font-medium">{periodLabel}</div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-medium text-apple-smoke/80">
            Requested {formatRequestedAt(request.created_at)}
          </p>
          {notes ? (
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 break-words">
              &quot;{notes}&quot;
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onOpenLogs(request)}
            disabled={logsLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#076d69] bg-[#076d69] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#0f766e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {logsLoading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Loading Logs...
              </>
            ) : (
              "View Employee Logs"
            )}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-apple-steel/80">
          Overtime Pay
        </p>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-semibold tracking-tight text-apple-charcoal">
            {formatMoney(request.amount)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-apple-smoke">
          
          {request.quantity.toLocaleString("en-PH")} total hr
          {request.quantity === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-6">
        <div className="text-[11px] italic text-apple-steel">
          Review required before payroll cutoff
        </div>
        {isResolved ? null : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onReject(request)}
              disabled={rowBusy}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#f0fdfa] px-4 text-xs font-bold text-[#0f766e] transition-colors hover:bg-[#ccfbf1] focus:outline-none focus:ring-2 focus:ring-[#ccfbf1] disabled:opacity-50"
              aria-label={`Return overtime request for ${request.employee_name ?? "employee"}`}
            >
              {rejectBusy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <XCircle size={16} />
              )}
              Return
            </button>

            <button
              type="button"
              onClick={() => onApprove(request.id)}
              disabled={rowBusy}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#076d69] px-5 text-xs font-bold text-white shadow-md shadow-teal-900/10 transition-all hover:bg-[#055f5b] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60"
              aria-label={`Approve overtime request for ${request.employee_name ?? "employee"}`}
            >
              {approveBusy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Approve Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
