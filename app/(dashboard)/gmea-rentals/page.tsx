import GmeaRentalsPage from "@/features/gmea-rentals/components/GmeaRentalsPage";
import { getGmeaRentalOperations, getGmeaRentals } from "@/features/gmea-rentals/server/gmeaRentalsQueries";
import { APP_ROLES, requireRole } from "@/lib/auth";
import { getHistoricalRentalIncome } from "@/features/gmea-rentals/server/historicalIncomeQueries";

export default async function GmeaRentalsRoute() {
  const [{ profile }, operations, rentals, historicalIncome] = await Promise.all([
    requireRole([APP_ROLES.GMEA, APP_ROLES.CEO]),
    getGmeaRentalOperations(),
    getGmeaRentals(),
    getHistoricalRentalIncome(),
  ]);
  return <GmeaRentalsPage equipment={operations.equipment} rentals={rentals} historicalIncome={historicalIncome} initialOperations={operations} canEdit={profile.role === APP_ROLES.GMEA} />;
}
