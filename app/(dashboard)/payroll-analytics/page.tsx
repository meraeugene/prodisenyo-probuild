import { requireRole } from "@/lib/auth";
import PayrollAnalyticsPageClient from "@/features/analytics/components/PayrollAnalyticsPageClient";
import { redirect } from "next/navigation";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ runId?: string }> }) {
  const { profile } = await requireRole(["ceo", "payroll_manager"]);
  if (profile.role === "ceo") {
    const { runId } = await searchParams;
    const params = new URLSearchParams({ view: "analytics" });
    if (runId) params.set("runId", runId);
    redirect(`/payroll-approvals?${params}`);
  }
  return <PayrollAnalyticsPageClient />;
}
