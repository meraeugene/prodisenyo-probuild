import { requireRole } from "@/lib/auth";
import OvertimeApprovalsPageClient from "@/features/payroll/components/OvertimeApprovalsPageClient";

export default async function OvertimeApprovalsPage() {
  await requireRole("ceo");
  return <OvertimeApprovalsPageClient />;
}
