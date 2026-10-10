import { notFound } from "next/navigation";
import { getGmeaProjects, requireGmeaAccess } from "@/features/gmea-projects/server/gmeaQueries";
import { isProjectMetric } from "@/features/gmea-projects/utils/projectMetrics";
import GmeaProjectMetricPage from "@/features/gmea-projects/components/GmeaProjectMetricPage";

export default async function Page({ params }: { params: Promise<{ metric: string }> }) {
  const { profile } = await requireGmeaAccess();
  const { metric } = await params;
  if (!isProjectMetric(metric)) notFound();
  const projects = await getGmeaProjects();
  return <GmeaProjectMetricPage key={metric} projects={projects} metric={metric} canEdit={profile.role === "gmea"} />;
}
