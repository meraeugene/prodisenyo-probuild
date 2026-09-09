import {
  getGmeaProjects,
  requireGmeaAccess,
} from "@/features/gmea-projects/server/gmeaQueries";
import GmeaProjectsPageClient from "@/features/gmea-projects/components/GmeaProjectsPageClient";
import CeoGmeaProjectsPageClient from "@/features/gmea-projects/components/CeoGmeaProjectsPageClient";
export default async function Page() {
  const { profile } = await requireGmeaAccess();
  const projects = await getGmeaProjects();
  if (profile.role === "ceo") return <CeoGmeaProjectsPageClient projects={projects} />;
  return (
    <GmeaProjectsPageClient
      projects={projects}
      canEdit={profile.role === "gmea"}
    />
  );
}
