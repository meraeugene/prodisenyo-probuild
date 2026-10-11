"use client";

import { useMemo, useState } from "react";
import { EQUIPMENT_STATUSES, RENTAL_STATUSES, type GmeaRental, type RentalEquipment } from "../types";
import { rentalLabel } from "../utils/rentalUi";
import { selectEquipment, selectRentals } from "../utils/rentalRecordSelectors";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import WorkspaceTabSwitch from "@/components/workspace/WorkspaceTabSwitch";
import WorkspaceSearchInput from "@/components/workspace/WorkspaceSearchInput";
import styles from "@/components/workspace/workspace.module.css";
import RentalRecordsTable from "./RentalRecordsTable";
import EquipmentRecordsTable from "./EquipmentRecordsTable";
import GmeaRentalsSummary from "./GmeaRentalsSummary";
import RentalBookingCharts from "./RentalBookingCharts";

export default function RentalBookingEquipmentRecords({ view, rentals, equipment, canEdit, onEditEquipment, onDeactivateEquipment, pending }: {
  view: "rentals" | "equipment"; rentals: GmeaRental[]; equipment: RentalEquipment[]; canEdit: boolean;
  onEditEquipment?: (item: RentalEquipment) => void;
  onDeactivateEquipment?: (item: RentalEquipment) => Promise<void>; pending?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [activity, setActivity] = useState("all");
  const [tab, setTab] = useState<"records" | "analytics">("records");
  const rentalRows = useMemo(() => selectRentals(rentals, query, status), [rentals, query, status]);
  const equipmentRows = useMemo(() => selectEquipment(equipment, query, status).filter(item => activity === "all" || String(item.is_active) === activity), [equipment, query, status, activity]);
  const pagination = useTablePagination<GmeaRental | RentalEquipment>(view === "rentals" ? rentalRows : equipmentRows, JSON.stringify([view, query, status, activity]));
  return <section aria-label={view === "rentals" ? "Rental booking records" : "Equipment records"} className={styles.panel}>
    {view === "rentals" && <div className="px-4 pt-4 sm:px-5"><WorkspaceTabSwitch label="Rental booking views" value={tab} onChange={setTab}
      items={[{ value: "records", label: "Bookings" }, { value: "analytics", label: "Analytics" }]} /></div>}
    <div className="px-4 pt-4 sm:px-5"><GmeaRentalsSummary rentals={rentals} equipment={equipment} /></div>
    <div className={styles.filters}>
      <label className={`${styles.field} ${styles.searchField}`}>{view === "rentals" ? "Search rentals" : "Search equipment"}<WorkspaceSearchInput value={query} onChange={event => setQuery(event.target.value)} placeholder={view === "rentals" ? "Rental number, client, or location" : "Equipment, asset code, or plate"} /></label>
      <label className={styles.field}>Status
        <select aria-label={`Filter ${view} by status`} className={styles.control} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>{(view === "rentals" ? RENTAL_STATUSES : EQUIPMENT_STATUSES).map((value) => <option key={value} value={value}>{rentalLabel(value)}</option>)}
        </select>
      </label>
      {view === "equipment" && <label className={styles.field}>Activity<select className={styles.control} aria-label="Filter equipment activity" value={activity} onChange={(event) => setActivity(event.target.value)}>
        <option value="all">Active and inactive</option><option value="true">Active only</option><option value="false">Inactive only</option>
      </select></label>}
      <button type="button" className={styles.button} disabled={!query && status === "all" && activity === "all"} onClick={() => { setQuery(""); setStatus("all"); setActivity("all"); }}>Reset filters</button>
    </div>
    {view === "rentals" && tab === "analytics" ? <div className="space-y-4 px-4 pb-4 sm:px-5">
      <header><h2 className="text-lg font-semibold">Rental booking analytics</h2><p className="mt-1 text-sm text-slate-500">Booking trends by rental start month and current status.</p></header>
      <RentalBookingCharts rentals={rentalRows} />
    </div> : <>
    {view === "rentals" ? <RentalRecordsTable rentals={pagination.pageRows as GmeaRental[]} hasRentals={rentals.length > 0} canEdit={canEdit} /> : <EquipmentRecordsTable equipment={pagination.pageRows as RentalEquipment[]} onEdit={onEditEquipment} onDeactivate={onDeactivateEquipment} pending={pending} />}
    <WorkspaceListPagination {...pagination} total={view === "rentals" ? rentalRows.length : equipmentRows.length} noun={view === "rentals" ? "rentals" : "units"} label="Rental workspace" />
    </>}
  </section>;
}
