import { requireRole } from "@/lib/auth";
import PayrollAnalyticsPageClient from "@/features/analytics/components/PayrollAnalyticsPageClient";

export default async function AnalyticsPage() {
  await requireRole(["ceo", "payroll_manager"]);
  return <PayrollAnalyticsPageClient />;
}
