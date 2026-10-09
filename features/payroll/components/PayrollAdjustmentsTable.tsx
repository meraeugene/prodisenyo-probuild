import { CheckCircle2, Loader2 } from "lucide-react";
import styles from "@/components/workspace/workspace.module.css";
import { formatMoney, formatRequestedAt, type PendingOvertimeRequest } from "../utils/payrollApprovalQueueHelpers";
import { getPayrollApprovalLabels } from "../utils/overtimeApprovalPresentation";
import OvertimeApprovalStatusBadge from "./OvertimeApprovalStatusBadge";

export default function PayrollAdjustmentsTable({ requests, pending, pendingActionId, pendingActionType, logsLoading, onOpenLogs, onApprove, onReject }: {
  requests: PendingOvertimeRequest[];
  pending: boolean;
  pendingActionId: string | null;
  pendingActionType: "approve" | "reject" | null;
  logsLoading: Record<string, boolean>;
  onOpenLogs: (request: PendingOvertimeRequest) => void;
  onApprove: (id: string) => void;
  onReject: (request: PendingOvertimeRequest) => void;
}) {
  return <div className="overflow-x-auto"><table className={styles.table} style={{ minWidth: 1120 }}>
    <caption className="sr-only">Payroll overtime adjustments</caption>
    <thead><tr>{["Employee", "Site / Period", "Hours", "Overtime pay", "Notes", "Submitted", "Status", "Actions"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
    <tbody>{requests.map(request => {
      const labels = getPayrollApprovalLabels(request);
      const approving = pendingActionId === request.id && pendingActionType === "approve";
      return <tr key={request.id}>
        <th scope="row" className="font-semibold text-slate-900">{labels.employee}</th>
        <td className="min-w-44 max-w-64 break-words">{labels.site}<p className="mt-1 text-xs text-slate-500">{labels.period}</p></td>
        <td className="whitespace-nowrap tabular-nums">{request.quantity.toLocaleString("en-PH", { maximumFractionDigits: 2 })}</td>
        <td className="whitespace-nowrap font-semibold tabular-nums">₱{formatMoney(request.amount)}</td>
        <td className="min-w-48 max-w-72 whitespace-pre-wrap break-words text-slate-600">{labels.notes || "—"}{labels.rejectionReason && <p className="mt-2 text-xs text-rose-700">Return reason: {labels.rejectionReason}</p>}</td>
        <td className="whitespace-nowrap text-xs text-slate-500">{formatRequestedAt(request.created_at)}</td>
        <td><OvertimeApprovalStatusBadge status={request.status} /></td>
        <td><div className="flex flex-wrap items-center gap-2">
          <button type="button" className={`${styles.button} whitespace-nowrap disabled:opacity-50`} disabled={Boolean(logsLoading[request.id])} onClick={() => onOpenLogs(request)}>
            {logsLoading[request.id] ? <><Loader2 size={14} className="animate-spin" />Loading logs…</> : "View Employee Logs"}
          </button>
          {request.status === "pending" && <>
            <button type="button" className={`${styles.button} disabled:opacity-50`} disabled={pending} aria-label={`Return overtime request for ${labels.employee}`} onClick={() => onReject(request)}>Return</button>
            <button type="button" className={`${styles.primaryButton} whitespace-nowrap disabled:opacity-50`} disabled={pending} aria-label={`Approve overtime request for ${labels.employee}`} onClick={() => onApprove(request.id)}>
              {approving ? <><Loader2 size={14} className="animate-spin" />Approving…</> : <><CheckCircle2 size={14} aria-hidden="true" />Approve Request</>}
            </button>
          </>}
        </div></td>
      </tr>;
    })}</tbody>
  </table></div>;
}
