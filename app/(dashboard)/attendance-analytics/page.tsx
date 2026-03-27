import { requireRole } from "@/lib/auth";
import AttendanceAnalyticsPageClient from "@/features/analytics/components/AttendanceAnalyticsPageClient";

export default async function AttendanceAnalyticsPage() {
  await requireRole("ceo");
  return <AttendanceAnalyticsPageClient />;
}
