import GmeaRentalsReports from "@/features/gmea-rentals/components/GmeaRentalsReports";
import { getGmeaRentalAnalytics } from "@/features/gmea-rentals/server/gmeaRentalsQueries";
import { APP_ROLES, requireRole } from "@/lib/auth";

export default async function GmeaRentalsReportsRoute() {
  const [{ profile }, analytics] = await Promise.all([
    requireRole([APP_ROLES.GMEA, APP_ROLES.CEO]),
    getGmeaRentalAnalytics(),
  ]);
  return (
    <GmeaRentalsReports
      initialData={analytics}
      canEdit={profile.role === APP_ROLES.GMEA}
    />
  );
}
