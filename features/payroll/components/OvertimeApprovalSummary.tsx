import { Banknote, ClipboardCheck, Clock3, FileClock } from "lucide-react";
import DashboardSummaryCards, {
  type DashboardSummaryCard,
} from "@/components/DashboardSummaryCards";
import type { OvertimeRequestRecord } from "@/features/overtime-requests/types";
import type { PendingOvertimeRequest } from "@/features/payroll/utils/payrollApprovalQueueHelpers";

export default function OvertimeApprovalSummary({
  payrollRequests,
  staffRequests,
}: {
  payrollRequests: PendingOvertimeRequest[];
  staffRequests: OvertimeRequestRecord[];
}) {
  const pendingPayroll = payrollRequests.filter(
    (request) => request.status === "pending",
  );
  const pendingStaff = staffRequests.filter(
    (request) => request.status === "pending",
  );
  const hours = pendingStaff.reduce(
    (sum, request) => sum + Number(request.overtime_hours || 0),
    0,
  );
  const amount = [...pendingPayroll, ...pendingStaff].reduce(
    (sum, request) => sum + Number(request.amount || 0),
    0,
  );
  const cards: DashboardSummaryCard[] = [
    { label: "Pending decisions", value: pendingPayroll.length + pendingStaff.length, icon: ClipboardCheck, iconColor: "text-teal-600" },
    { label: "Payroll overtime", value: pendingPayroll.length, icon: FileClock, iconColor: "text-amber-500" },
    { label: "Requested hours", value: hours.toLocaleString("en-PH", { maximumFractionDigits: 2 }), icon: Clock3, iconColor: "text-sky-500" },
    {
      label: "Pending amount",
      value: `₱${amount.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: Banknote,
      iconColor: "text-violet-600",
    },
  ];

  return <DashboardSummaryCards ariaLabel="Overtime approval summary" cards={cards} />;
}
