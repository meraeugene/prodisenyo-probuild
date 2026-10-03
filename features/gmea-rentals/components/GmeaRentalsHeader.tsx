import { Plus } from "lucide-react";
import DashboardPageHero from "@/components/DashboardPageHero";

export default function GmeaRentalsHeader({ canEdit, onAddEquipment, onCreateRental }: {
  canEdit: boolean;
  onAddEquipment: () => void;
  onCreateRental: () => void;
}) {
  return <DashboardPageHero eyebrow="GMEA Marketing Corporation" title="GMEA Rentals" description="Manage rental schedules and equipment in one workspace." actions={canEdit && <>
    <button type="button" onClick={onAddEquipment} className="workspace-secondary-action inline-flex items-center gap-2 rounded-[10px] bg-white px-4 py-2.5 text-sm text-[#076d69]"><Plus size={16} />Add equipment</button>
    <button type="button" onClick={onCreateRental} className="inline-flex items-center gap-2 rounded-[10px] bg-white px-4 py-2.5 text-sm text-[#076d69]"><Plus size={16} />New rental</button>
  </>} />;
}
