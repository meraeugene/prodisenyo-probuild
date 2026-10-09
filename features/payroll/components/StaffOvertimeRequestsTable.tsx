import { CheckCircle2, Loader2 } from "lucide-react";
import styles from "@/components/workspace/workspace.module.css";
import { formatOvertimeRequesterRole, type OvertimeRequestRecord } from "@/features/overtime-requests/types";
import { formatMoney, formatRequestedAt } from "../utils/payrollApprovalQueueHelpers";
import OvertimeApprovalStatusBadge from "./OvertimeApprovalStatusBadge";

export default function StaffOvertimeRequestsTable({ requests, pending, approvingId, onApprove, onReject }: {
  requests: OvertimeRequestRecord[];
  pending: boolean;
  approvingId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return <div className="overflow-x-auto"><table className={styles.table} style={{ minWidth: 1120 }}>
    <caption className="sr-only">Staff overtime request forms</caption>
    <thead><tr>{["Employee / Role", "Site / Period", "Work date", "Hours", "Reason", "Submitted", "Status", "Actions"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
    <tbody>{requests.map(request => <tr key={request.id}>
      <th scope="row" className="font-semibold text-slate-900">{request.employee_name}<p className="mt-1 text-xs font-normal text-slate-500">{formatOvertimeRequesterRole(request.requester_role)}</p></th>
      <td className="min-w-44 max-w-64 break-words">{request.site_name}{request.period_label && <p className="mt-1 text-xs text-slate-500">{request.period_label}</p>}</td>
      <td className="whitespace-nowrap">{request.request_date}</td>
      <td className="whitespace-nowrap tabular-nums">{request.overtime_hours.toLocaleString("en-PH", { maximumFractionDigits: 2 })}
        {!["payroll_manager", "engineer", "employee"].includes(request.requester_role) && <p className="mt-1 text-xs text-slate-500">₱{formatMoney(request.amount)}</p>}
      </td>
      <td className="min-w-48 max-w-72 whitespace-pre-wrap break-words text-slate-600">{request.reason || "—"}{request.rejection_reason && <p className="mt-2 text-xs text-rose-700">Return reason: {request.rejection_reason}</p>}</td>
      <td className="whitespace-nowrap text-xs text-slate-500">{formatRequestedAt(request.created_at)}</td>
      <td><OvertimeApprovalStatusBadge status={request.status} /></td>
      <td>{request.status === "pending" && <div className="flex items-center gap-2">
        <button type="button" disabled={pending} onClick={() => onReject(request.id)} className={`${styles.button} disabled:opacity-50`}>Return</button>
        <button type="button" disabled={pending} onClick={() => onApprove(request.id)} className={`${styles.primaryButton} whitespace-nowrap disabled:opacity-50`}>
          {approvingId === request.id ? <><Loader2 size={14} className="animate-spin" />Approving…</> : <><CheckCircle2 size={14} aria-hidden="true" />Approve request</>}
        </button>
      </div>}</td>
    </tr>)}</tbody>
  </table></div>;
}
