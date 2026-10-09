import { notFound } from "next/navigation";
import { APP_ROLES, requireRole } from "@/lib/auth";
import GmeaOverviewDetailsPage from "@/features/gmea-overview/components/GmeaOverviewDetailsPage";
import { getGmeaOverviewData } from "@/features/gmea-overview/server/gmeaOverviewQueries";
import { isGmeaOverviewMetric } from "@/features/gmea-overview/utils/gmeaOverviewMetrics";

export default async function GmeaOverviewMetricRoute({ params }: { params: Promise<{ metric: string }> }) {
  const { profile } = await requireRole([APP_ROLES.GMEA, APP_ROLES.CEO]);
  const { metric } = await params;
  if (!isGmeaOverviewMetric(metric)) notFound();
  const data = await getGmeaOverviewData();
  return <GmeaOverviewDetailsPage key={metric} initialData={data} metric={metric} canEdit={profile.role === APP_ROLES.GMEA} />;
}
