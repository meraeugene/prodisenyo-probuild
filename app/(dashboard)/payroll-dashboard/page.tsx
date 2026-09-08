import { APP_ROLES, requireRole } from "@/lib/auth";
import PayrollDashboardPage from "@/features/payroll-dashboard/components/PayrollDashboardPage";
import { getPayrollDashboardData } from "@/features/payroll-dashboard/server/getPayrollDashboardData";

export default async function PayrollDashboardRoute() {
  const { user } = await requireRole(APP_ROLES.PAYROLL_MANAGER);
  const data = await getPayrollDashboardData(user.id);

  return <PayrollDashboardPage data={data} />;
}
