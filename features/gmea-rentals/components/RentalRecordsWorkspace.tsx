"use client";

import type { GmeaRental, RentalEquipment, RentalOperationsData } from "../types";
import type { RentalIncomeRecord } from "../incomeTypes";
import type { RentalSection } from "../utils/rentalSections";
import styles from "@/components/workspace/workspace.module.css";
import GmeaRentalExpensesWorkspace from "./GmeaRentalExpensesWorkspace";
import GmeaRentalPortfolio from "./GmeaRentalPortfolio";
import RentalBookingEquipmentRecords from "./RentalBookingEquipmentRecords";

export default function RentalRecordsWorkspace({ section, rentals, equipment, operations, historicalIncome = [], onEditEquipment, onDeactivateEquipment, pending }: {
  section: RentalSection; historicalIncome?: RentalIncomeRecord[]; rentals: GmeaRental[]; equipment: RentalEquipment[];
  onEditEquipment?: (item: RentalEquipment) => void;
  onDeactivateEquipment?: (item: RentalEquipment) => Promise<void>; pending?: boolean; operations: RentalOperationsData;
}) {
  if (section === "income") return <GmeaRentalPortfolio rentals={rentals} historicalIncome={historicalIncome} operations={operations} canEdit={!!onEditEquipment} />;
  if (section === "expenses") return <section className={styles.panel}><GmeaRentalExpensesWorkspace operations={operations} rentals={rentals} canEdit={!!onEditEquipment} /></section>;
  return <RentalBookingEquipmentRecords key={section} view={section === "bookings" ? "rentals" : "equipment"} rentals={rentals} equipment={equipment}
    canEdit={!!onEditEquipment} onEditEquipment={onEditEquipment} onDeactivateEquipment={onDeactivateEquipment} pending={pending} />;
}
