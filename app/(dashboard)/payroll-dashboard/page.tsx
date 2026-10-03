import { APP_ROLES, requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PayrollDashboardRoute() {
  await requireRole(APP_ROLES.PAYROLL_MANAGER);
  redirect("/payroll-workspace");
}
