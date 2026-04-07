"use client";

import {
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  XCircle,
} from "lucide-react";
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
  onAction: (adjustmentId: string, action: "approve" | "reject") => void;
}

export default function PayrollApprovalQueueCard({
  request,
  isPending,
  pendingActionId,
  pendingActionType,
  logsLoading,
  onOpenLogs,
  onAction,
}: PayrollApprovalQueueCardProps) {
  const run = getRelationValue(request.payroll_runs);
  const rowBusy = isPending && pendingActionId === request.id;
  const isResolved = request.status !== "pending";
  const rejectBusy = rowBusy && pendingActionType === "reject";
  const approveBusy = rowBusy && pendingActionType === "approve";
  const siteLabel = run?.site_name?.trim() || request.site_name?.trim() || "Unknown Site";
  const employeeLabel = request.employee_name ?? "Unknown Employee";
  const periodLabel = run?.period_label ?? request.period_label ?? "Unknown Period";
  const notes = parseOvertimeRequestNotes(request.notes).displayNotes;

  return (
    <div className="group flex h-full w-full max-w-full flex-col rounded-2xl border border-apple-mist bg-[rgb(var(--apple-snow))] p-5 shadow-[0_8px_20px_rgba(24,83,43,0.04)] transition-all">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-[15px] font-bold tracking-tight text-apple-charcoal">
            {employeeLabel}
          </h3>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset",
              request.status === "approved"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200/40"
                : request.status === "rejected"
                  ? "bg-rose-50 text-rose-700 ring-rose-200/40"
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
                Rejected
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
            <div className="relative rounded-xl border border-apple-mist/50 bg-blue-50 px-3.5 py-2.5 text-xs italic shadow-sm">
              &quot;{notes}&quot;
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onOpenLogs(request)}
            disabled={logsLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1f6a37] bg-[#1f6a37] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#18532b] disabled:cursor-not-allowed disabled:opacity-60"
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

      <div className="mt-6 rounded-2xl border border-apple-mist bg-white p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-apple-steel/80">
          Overtime Pay
        </p>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-black tracking-tight text-apple-charcoal">
            {formatMoney(request.amount)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-apple-smoke">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
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
              onClick={() => onAction(request.id, "reject")}
              disabled={rowBusy}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-50 px-4 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:opacity-50"
              aria-label={`Reject overtime request for ${request.employee_name ?? "employee"}`}
            >
              {rejectBusy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <XCircle size={16} />
              )}
              Reject
            </button>

            <button
              type="button"
              onClick={() => onAction(request.id, "approve")}
              disabled={rowBusy}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1f6a37] px-5 text-xs font-bold text-white shadow-md shadow-emerald-900/10 transition-all hover:bg-[#18552d] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
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
