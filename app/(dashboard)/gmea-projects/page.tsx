import {
  getGmeaProjects,
  requireGmeaAccess,
} from "@/features/gmea-projects/server/gmeaQueries";
import GmeaProjectsPageClient from "@/features/gmea-projects/components/GmeaProjectsPageClient";
export default async function Page() {
  const { profile } = await requireGmeaAccess();
  return (
    <GmeaProjectsPageClient
      projects={await getGmeaProjects()}
      canEdit={profile.role === "gmea"}
    />
  );
}
