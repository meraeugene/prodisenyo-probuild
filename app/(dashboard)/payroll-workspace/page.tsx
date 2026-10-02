import { APP_ROLES, requireRole } from "@/lib/auth";
import PayrollWorkspacePage from "@/features/payroll-dashboard/components/PayrollWorkspacePage";
import { getPayrollDashboardData } from "@/features/payroll-dashboard/server/getPayrollDashboardData";

export default async function PayrollWorkspaceRoute() {
  const { user } = await requireRole(APP_ROLES.PAYROLL_MANAGER);
  const data = await getPayrollDashboardData(user.id);

  return <PayrollWorkspacePage data={data} />;
}
