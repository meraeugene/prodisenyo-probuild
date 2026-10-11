import { requireRole } from "@/lib/auth";
import PayrollReportsPageClient from "@/features/payroll-reports/components/PayrollReportsPageClient";
import { getPayrollReportsDataAction } from "@/actions/payroll";

export default async function PayrollApprovalsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requireRole("ceo");
  const initialData = await getPayrollReportsDataAction();

  const { view } = await searchParams;
  return <PayrollReportsPageClient initialData={initialData} initialView={view === "analytics" ? "analytics" : "records"} />;
}
