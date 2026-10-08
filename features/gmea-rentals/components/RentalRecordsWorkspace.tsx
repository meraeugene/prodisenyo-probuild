"use client";

import { useMemo, useState } from "react";
import { EQUIPMENT_STATUSES, RENTAL_STATUSES, type GmeaRental, type RentalEquipment } from "../types";
import { rentalLabel } from "../utils/rentalUi";
import { selectEquipment, selectRentals } from "../utils/rentalRecordSelectors";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import WorkspaceListToolbar from "@/components/workspace/WorkspaceListToolbar";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import styles from "@/components/workspace/workspace.module.css";
import RentalRecordsTable from "./RentalRecordsTable";
import EquipmentRecordsTable from "./EquipmentRecordsTable";

export default function RentalRecordsWorkspace({ rentals, equipment, onEditEquipment, onDeactivateEquipment, pending }: {
  rentals: GmeaRental[]; equipment: RentalEquipment[]; onEditEquipment?: (item: RentalEquipment) => void;
  onDeactivateEquipment?: (item: RentalEquipment) => void; pending?: boolean;
}) {
  const [view, setView] = useState<"rentals" | "equipment">("rentals");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [activity, setActivity] = useState("all");
  const rentalRows = useMemo(() => selectRentals(rentals, query, status), [rentals, query, status]);
  const equipmentRows = useMemo(() => selectEquipment(equipment, query, status).filter((item) => activity === "all" || String(item.is_active) === activity), [equipment, query, status, activity]);
  const pagination = useTablePagination<GmeaRental | RentalEquipment>(view === "rentals" ? rentalRows : equipmentRows, JSON.stringify([view, query, status, activity]));
  return <section aria-label="Rental and equipment records" className={styles.panel}>
    <WorkspaceListToolbar tabs={[{ value: "rentals", label: "Rentals", count: rentals.length }, { value: "equipment", label: "Equipment", count: equipment.length }]} tab={view}
      onTabChange={(value) => { setView(value); setQuery(""); setStatus("all"); setActivity("all"); }} query={query} onQueryChange={setQuery}
      searchLabel={view === "rentals" ? "Search rentals" : "Search equipment"} placeholder={view === "rentals" ? "Rental number, client, or location" : "Equipment, asset code, or plate"}
      hasFilters={query !== "" || status !== "all" || activity !== "all"} onReset={() => { setQuery(""); setStatus("all"); setActivity("all"); }}>
      <label className={styles.field}>Status
        <select aria-label={`Filter ${view} by status`} className={styles.control} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>{(view === "rentals" ? RENTAL_STATUSES : EQUIPMENT_STATUSES).map((value) => <option key={value} value={value}>{rentalLabel(value)}</option>)}
        </select>
      </label>
      {view === "equipment" && <label className={styles.field}>Activity<select className={styles.control} aria-label="Filter equipment activity" value={activity} onChange={(event) => setActivity(event.target.value)}>
        <option value="all">Active and inactive</option><option value="true">Active only</option><option value="false">Inactive only</option>
      </select></label>}
    </WorkspaceListToolbar>
    {view === "rentals" ? <RentalRecordsTable rentals={pagination.pageRows as GmeaRental[]} /> : <EquipmentRecordsTable equipment={pagination.pageRows as RentalEquipment[]} onEdit={onEditEquipment} onDeactivate={onDeactivateEquipment} pending={pending} />}
    <WorkspaceListPagination {...pagination} total={view === "rentals" ? rentalRows.length : equipmentRows.length} noun={view === "rentals" ? "rentals" : "units"} label="Rental workspace" />
  </section>;
}
