"use client";

import { useMemo, useState } from "react";
import { EQUIPMENT_STATUSES, RENTAL_STATUSES, type GmeaRental, type RentalEquipment } from "../types";
import { rentalLabel } from "../utils/rentalUi";
import { selectCeoEquipment, selectCeoRentals } from "../utils/ceoRentalSelectors";
import { useCeoTablePagination } from "@/features/ceo-workspace/hooks/useCeoTablePagination";
import CeoListToolbar from "@/features/ceo-workspace/components/CeoListToolbar";
import CeoListPagination from "@/features/ceo-workspace/components/CeoListPagination";
import styles from "@/features/ceo-workspace/components/ceoWorkspace.module.css";
import CeoRentalsTable from "./CeoRentalsTable";
import CeoEquipmentTable from "./CeoEquipmentTable";

export default function CeoRentalWorkspace({ rentals, equipment }: { rentals: GmeaRental[]; equipment: RentalEquipment[] }) {
  const [view, setView] = useState<"rentals" | "equipment">("rentals");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const rentalRows = useMemo(() => selectCeoRentals(rentals, query, status), [rentals, query, status]);
  const equipmentRows = useMemo(() => selectCeoEquipment(equipment, query, status), [equipment, query, status]);
  const pagination = useCeoTablePagination<GmeaRental | RentalEquipment>(view === "rentals" ? rentalRows : equipmentRows, JSON.stringify([view, query, status]));
  return <section aria-label="Rental and equipment records" className={styles.panel}>
    <CeoListToolbar tabs={[{ value: "rentals", label: "Rentals", count: rentals.length }, { value: "equipment", label: "Equipment", count: equipment.length }]} tab={view}
      onTabChange={(value) => { setView(value); setQuery(""); setStatus("all"); }} query={query} onQueryChange={setQuery}
      searchLabel={view === "rentals" ? "Search rentals" : "Search equipment"} placeholder={view === "rentals" ? "Rental number, client, or location" : "Equipment, asset code, or plate"}
      hasFilters={query !== "" || status !== "all"} onReset={() => { setQuery(""); setStatus("all"); }}>
      <label className={styles.field}>Status
        <select aria-label={`Filter ${view} by status`} className={styles.control} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>{(view === "rentals" ? RENTAL_STATUSES : EQUIPMENT_STATUSES).map((value) => <option key={value} value={value}>{rentalLabel(value)}</option>)}
        </select>
      </label>
    </CeoListToolbar>
    {view === "rentals" ? <CeoRentalsTable rentals={pagination.pageRows as GmeaRental[]} /> : <CeoEquipmentTable equipment={pagination.pageRows as RentalEquipment[]} />}
    <CeoListPagination {...pagination} total={view === "rentals" ? rentalRows.length : equipmentRows.length} noun={view === "rentals" ? "rentals" : "units"} label="Rental workspace" />
  </section>;
}
