import { notFound } from "next/navigation";
import GmeaRentalWorkspace from "@/features/gmea-rentals/components/GmeaRentalWorkspace";
import {
  getGmeaRentalOperations,
  getGmeaRentals,
} from "@/features/gmea-rentals/server/gmeaRentalsQueries";
import { validEquipmentId } from "@/features/gmea-rentals/utils/equipmentValidation";
import { APP_ROLES, requireRole } from "@/lib/auth";
export default async function RentalDetailPage({
  params,
}: {
  params: Promise<{ rentalId: string }>;
}) {
  const { profile } = await requireRole([APP_ROLES.GMEA, APP_ROLES.CEO]);
  const { rentalId } = await params;
  try {
    validEquipmentId(rentalId);
  } catch {
    notFound();
  }
  const [rental, operations] = await Promise.all([
    getGmeaRentals(rentalId).then((rows) => rows[0]),
    getGmeaRentalOperations(),
  ]);
  if (!rental) notFound();
  return (
    <GmeaRentalWorkspace
      rental={rental}
      initialOperations={operations}
      canEdit={profile.role === APP_ROLES.GMEA}
    />
  );
}
