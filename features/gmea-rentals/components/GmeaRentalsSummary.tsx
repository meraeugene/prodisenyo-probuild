import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import type { GmeaRental, RentalEquipment } from "../types";

export default function GmeaRentalsSummary({
  rentals,
  equipment,
}: {
  rentals: GmeaRental[];
  equipment: RentalEquipment[];
}) {
  const entries = [
    {
      label: "Rentals",
      value: rentals.length,
    },
    {
      label: "Active rentals",
      value: rentals.filter((rental) => rental.status === "active").length,
    },
    {
      label: "Active equipment",
      value: equipment.filter((item) => item.is_active).length,
    },
  ];

  return <WorkspaceSummaryCards ariaLabel="Rentals summary" className="sm:grid-cols-3" cards={entries} />;
}
