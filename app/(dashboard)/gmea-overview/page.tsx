import GmeaOverviewPage from "@/features/gmea-overview/components/GmeaOverviewPage";
import { getGmeaOverviewData } from "@/features/gmea-overview/server/gmeaOverviewQueries";
import { APP_ROLES, requireRole } from "@/lib/auth";

export default async function GmeaOverviewRoute() {
  const [{ profile }, data] = await Promise.all([
    requireRole([APP_ROLES.GMEA, APP_ROLES.CEO]),
    getGmeaOverviewData(),
  ]);
  return (
    <GmeaOverviewPage
      initialData={data}
      canEdit={profile.role === APP_ROLES.GMEA}
    />
  );
}
