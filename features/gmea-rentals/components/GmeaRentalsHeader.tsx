import { Plus } from "lucide-react";
import { rentalSections, type RentalSection } from "../utils/rentalSections";
import DashboardPageHero from "@/components/DashboardPageHero";

export default function GmeaRentalsHeader({ section, canEdit, onAddEquipment, onCreateRental }: {
  section: RentalSection;
  canEdit: boolean;
  onAddEquipment: () => void;
  onCreateRental: () => void;
}) {
  const { title, description } = rentalSections[section];
  return <DashboardPageHero eyebrow="GMEA / Rentals" title={title} description={description} actions={canEdit && <>
    {section === "equipment" && <button type="button" onClick={onAddEquipment} className="workspace-secondary-action inline-flex items-center gap-2 rounded-[10px] bg-white px-4 py-2.5 text-sm text-[#076d69]"><Plus size={16} />Add equipment</button>}
    {section === "bookings" && <button type="button" onClick={onCreateRental} className="inline-flex items-center gap-2 rounded-[10px] bg-white px-4 py-2.5 text-sm text-[#076d69]"><Plus size={16} />New rental</button>}
  </>} />;
}
