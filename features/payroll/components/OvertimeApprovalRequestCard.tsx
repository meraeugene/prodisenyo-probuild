import { CheckCircle2, Clock3, Loader2, MapPin, XCircle } from "lucide-react";
import { formatOvertimeRequesterRole, type OvertimeRequestRecord } from "@/features/overtime-requests/types";
import styles from "@/features/ceo-workspace/components/ceoWorkspace.module.css";
import { formatRequestedAt } from "../utils/payrollApprovalQueueHelpers";

export default function OvertimeApprovalRequestCard({ request, pending, approving, onApprove, onReject }: {
  request: OvertimeRequestRecord; pending: boolean; approving: boolean;
  onApprove: (id: string) => void; onReject: (id: string) => void;
}) {
  const statusLabel = request.status === "rejected" ? "Returned" : request.status === "approved" ? "Approved" : "Pending";
  const statusClass = request.status === "approved" ? "bg-emerald-50 text-emerald-700" : request.status === "rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700";
  const StatusIcon = request.status === "approved" ? CheckCircle2 : request.status === "rejected" ? XCircle : Clock3;
  return <article className={`${styles.panel} p-5`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-sm font-semibold text-slate-900">{request.employee_name}</h3><p className="mt-1 text-xs text-slate-500">{formatOvertimeRequesterRole(request.requester_role)}</p></div>
      <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium ${statusClass}`}><StatusIcon size={12} aria-hidden="true" />{statusLabel}</span>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden="true" />{request.site_name}</span><span>{request.request_date}</span></div>
    {request.period_label && <p className="mt-2 text-xs text-slate-500">Period: {request.period_label}</p>}
    {request.reason && <p className="mt-3 break-words rounded bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">{request.reason}</p>}
    <p className="mt-3 text-[11px] text-slate-500">Submitted {formatRequestedAt(request.created_at)}</p>
    {request.rejection_reason && <p className="mt-3 break-words rounded bg-rose-50 p-3 text-xs text-rose-700">Return reason: {request.rejection_reason}</p>}
    {!["payroll_manager", "engineer", "employee"].includes(request.requester_role) && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3"><span className="text-xs text-slate-500">Overtime pay · {request.overtime_hours.toFixed(2)} hrs</span><strong className="text-sm tabular-nums">₱{request.amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>}
    {request.status === "pending" && <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
      <button type="button" disabled={pending} onClick={() => onReject(request.id)} className={styles.button}>Return</button>
      <button type="button" disabled={pending} onClick={() => onApprove(request.id)} className={`${styles.primaryButton} disabled:opacity-50`}>
        {approving ? <><Loader2 size={14} className="animate-spin" />Approving…</> : <><CheckCircle2 size={14} aria-hidden="true" />Approve request</>}
      </button>
    </div>}
  </article>;
}
