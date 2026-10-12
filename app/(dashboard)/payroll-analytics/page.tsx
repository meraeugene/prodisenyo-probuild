import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ runId?: string }> }) {
  await requireRole("ceo");
  const { runId } = await searchParams;
  const params = new URLSearchParams({ view: "analytics" });
  if (runId) params.set("runId", runId);
  redirect(`/payroll-approvals?${params}`);
}
