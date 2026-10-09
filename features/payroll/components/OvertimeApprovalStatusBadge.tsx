import type { AdjustmentStatus } from "@/types/database";

export default function OvertimeApprovalStatusBadge({ status }: { status: AdjustmentStatus }) {
  const label = status === "approved" ? "Approved" : status === "rejected" ? "Returned" : "Pending";
  const color = status === "approved" ? "bg-teal-50 text-teal-700" : status === "rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800";
  return <span className={`inline-flex whitespace-nowrap rounded px-2.5 py-1 text-xs font-medium ${color}`}>{label}</span>;
}
