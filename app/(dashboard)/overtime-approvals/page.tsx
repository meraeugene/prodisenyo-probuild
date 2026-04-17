import { requireRole } from "@/lib/auth";
import OvertimeApprovalsPageClient from "@/features/payroll/components/OvertimeApprovalsPageClient";
import {
  getOvertimeRequestsApprovalDataAction,
  getPendingOvertimeApprovalsAction,
} from "@/actions/payroll";
import type { PendingOvertimeRequest } from "@/features/payroll/utils/payrollApprovalQueueHelpers";
import type { OvertimeRequestRecord } from "@/features/overtime-requests/types";

export default async function OvertimeApprovalsPage() {
  await requireRole("ceo");
  const [initialData, overtimeRequestData] = await Promise.all([
    getPendingOvertimeApprovalsAction(),
    getOvertimeRequestsApprovalDataAction(),
  ]);

  const initialRequests =
    initialData.requests as unknown as PendingOvertimeRequest[];
  const initialOvertimeRequests =
    overtimeRequestData.requests as unknown as OvertimeRequestRecord[];

  return (
    <OvertimeApprovalsPageClient
      initialRequests={initialRequests}
      initialOvertimeRequests={initialOvertimeRequests}
    />
  );
}
