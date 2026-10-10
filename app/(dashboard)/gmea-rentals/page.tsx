import GmeaRentalsPage from "@/features/gmea-rentals/components/GmeaRentalsPage";
import { getGmeaRentalOperations, getGmeaRentals } from "@/features/gmea-rentals/server/gmeaRentalsQueries";
import { APP_ROLES, requireRole } from "@/lib/auth";

export default async function GmeaRentalsRoute() {
  const [{ profile }, operations, rentals] = await Promise.all([
    requireRole([APP_ROLES.GMEA, APP_ROLES.CEO]),
    getGmeaRentalOperations(),
    getGmeaRentals(),
  ]);
  return <GmeaRentalsPage equipment={operations.equipment} rentals={rentals} initialOperations={operations} canEdit={profile.role === APP_ROLES.GMEA} />;
}
