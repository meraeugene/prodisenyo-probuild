import { requireRole } from "@/lib/auth";
import OvertimeApprovalsPageClient from "@/features/payroll/components/OvertimeApprovalsPageClient";
import { getPendingOvertimeApprovalsAction } from "@/actions/payroll";
import type { PendingOvertimeRequest } from "@/features/payroll/utils/payrollApprovalQueueHelpers";

export default async function OvertimeApprovalsPage() {
  await requireRole("ceo");
  const initialData = await getPendingOvertimeApprovalsAction();
  const initialRequests =
    initialData.requests as unknown as PendingOvertimeRequest[];

  return <OvertimeApprovalsPageClient initialRequests={initialRequests} />;
}
