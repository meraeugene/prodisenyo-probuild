import GmeaRentalsPage from "@/features/gmea-rentals/components/GmeaRentalsPage";
import { getGmeaRentalEquipment, getGmeaRentals } from "@/features/gmea-rentals/server/gmeaRentalsQueries";
import { APP_ROLES, requireRole } from "@/lib/auth";

export default async function GmeaRentalsRoute() {
  const [{ profile }, equipment, rentals] = await Promise.all([
    requireRole([APP_ROLES.GMEA, APP_ROLES.CEO]),
    getGmeaRentalEquipment(),
    getGmeaRentals(),
  ]);
  return <GmeaRentalsPage equipment={equipment} rentals={rentals} canEdit={profile.role === APP_ROLES.GMEA} />;
}
