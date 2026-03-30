import { requireRole } from "@/lib/auth";
import PayrollReportsPageClient from "@/features/payroll-reports/components/PayrollReportsPageClient";

export default async function PayrollReportsPage() {
  await requireRole("ceo");
  return <PayrollReportsPageClient />;
}
