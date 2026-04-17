import { APP_ROLES, requireRole } from "@/lib/auth";
import { getMyOvertimeRequestsAction } from "@/actions/payroll";
import OvertimeRequestPageClient from "@/features/overtime-requests/components/OvertimeRequestPageClient";
import type { OvertimeRequestRecord } from "@/features/overtime-requests/types";

export default async function OvertimeRequestPage() {
  const { profile } = await requireRole([
    APP_ROLES.PAYROLL_MANAGER,
    APP_ROLES.ENGINEER,
    APP_ROLES.EMPLOYEE,
  ]);

  const initialData = await getMyOvertimeRequestsAction();
  const initialRequests = initialData.requests as OvertimeRequestRecord[];
  const initialEmployeeName =
    profile.full_name?.trim() || profile.username?.trim() || profile.email;

  return (
    <OvertimeRequestPageClient
      initialRequests={initialRequests}
      initialEmployeeName={initialEmployeeName}
    />
  );
}
