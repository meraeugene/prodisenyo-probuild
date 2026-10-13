import { Plus } from "lucide-react";
import { rentalSections, type RentalSection } from "../utils/rentalSections";
import DashboardPageHero from "@/components/DashboardPageHero";

export default function GmeaRentalsHeader({ section, canEdit, onAddEquipment, onAddIncome, onAddExpense }: {
  section: RentalSection;
  canEdit: boolean;
  onAddEquipment: () => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
}) {
  const { title, description } = rentalSections[section];
  return <DashboardPageHero eyebrow="GMEA / Rentals" title={title} description={description} actions={canEdit && <>
    {section === "equipment" && <button type="button" onClick={onAddEquipment} className="workspace-secondary-action inline-flex items-center gap-2 rounded-[10px] bg-white px-4 py-2.5 text-sm text-[#076d69]"><Plus size={16} />Add equipment</button>}
    {(section === "bookings" || section === "income") && <>
      <button type="button" onClick={onAddExpense} className="workspace-secondary-action inline-flex items-center gap-2 rounded-[10px] bg-white px-4 py-2.5 text-sm text-[#076d69]"><Plus size={16} />Rental expense</button>
      <button type="button" onClick={onAddIncome} className="inline-flex items-center gap-2 rounded-[10px] bg-white px-4 py-2.5 text-sm text-[#076d69]"><Plus size={16} />Rental income</button>
    </>}
  </>} />;
}
