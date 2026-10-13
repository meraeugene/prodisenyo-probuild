import { APP_ROLES, requireRole } from "@/lib/auth";
import { getGmeaDashboardData } from "@/features/gmea-dashboard/server/gmeaDashboardQueries";
import GmeaDashboardPageClient from "@/features/gmea-dashboard/components/GmeaDashboardPageClient";

export default async function GmeaDashboardPage() {
  await requireRole([APP_ROLES.GMEA, APP_ROLES.CEO]);
  return <GmeaDashboardPageClient initialData={await getGmeaDashboardData()} />;
}
