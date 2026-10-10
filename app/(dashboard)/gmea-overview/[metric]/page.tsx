import { notFound, redirect } from "next/navigation";
import { APP_ROLES, requireRole } from "@/lib/auth";
import { isProjectMetric } from "@/features/gmea-projects/utils/projectMetrics";

export default async function GmeaOverviewMetricRoute({ params }: { params: Promise<{ metric: string }> }) {
  await requireRole([APP_ROLES.GMEA, APP_ROLES.CEO]);
  const { metric } = await params;
  if (!isProjectMetric(metric)) notFound();
  redirect(`/gmea-projects/summary/${metric}`);
}
