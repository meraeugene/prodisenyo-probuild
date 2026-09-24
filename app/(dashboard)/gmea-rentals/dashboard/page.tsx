import GmeaRentalsDashboard from "@/features/gmea-rentals/components/GmeaRentalsDashboard";
import { getGmeaRentalAnalytics } from "@/features/gmea-rentals/server/gmeaRentalsQueries";
import { APP_ROLES, requireRole } from "@/lib/auth";

export default async function GmeaRentalsDashboardRoute() {
  const [{ profile }, analytics] = await Promise.all([
    requireRole([APP_ROLES.GMEA, APP_ROLES.CEO]),
    getGmeaRentalAnalytics(),
  ]);
  return (
    <GmeaRentalsDashboard
      initialData={analytics}
      canEdit={profile.role === APP_ROLES.GMEA}
    />
  );
}
