"use client";

import { useMemo, useState } from "react";
import { EQUIPMENT_STATUSES, RENTAL_STATUSES, type GmeaRental, type RentalEquipment, type RentalOperationsData } from "../types";
import { rentalLabel } from "../utils/rentalUi";
import { selectEquipment, selectRentals } from "../utils/rentalRecordSelectors";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import WorkspaceTabSwitch from "@/components/workspace/WorkspaceTabSwitch";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import styles from "@/components/workspace/workspace.module.css";
import RentalRecordsTable from "./RentalRecordsTable";
import EquipmentRecordsTable from "./EquipmentRecordsTable";
import GmeaRentalExpensesWorkspace from "./GmeaRentalExpensesWorkspace";
import GmeaRentalIncomeWorkspace from "./GmeaRentalIncomeWorkspace";
import { useRentalIncomePage } from "../hooks/useRentalIncomePage";
import { buildRentalReportingWeeks } from "../utils/rentalReportingWeeks";
import GmeaRentalsSummary from "./GmeaRentalsSummary";
import type { RentalIncomeRecord } from "../incomeTypes";

export default function RentalRecordsWorkspace({ rentals, equipment, operations, historicalIncome = [], onEditEquipment, onDeactivateEquipment, pending }: {
  historicalIncome?: RentalIncomeRecord[];
  rentals: GmeaRental[]; equipment: RentalEquipment[]; onEditEquipment?: (item: RentalEquipment) => void;
  onDeactivateEquipment?: (item: RentalEquipment) => Promise<void>; pending?: boolean;
  operations: RentalOperationsData;
}) {
  const [view, setView] = useState<"income" | "expenses" | "rentals" | "equipment">("income");
  const incomeState = useRentalIncomePage(useMemo(()=>[...rentals,...historicalIncome], [rentals,historicalIncome]));
  const [expenseView, setExpenseView] = useState<"monthly" | "weekly" | "history">("monthly");
  const [expenseMonth, setExpenseMonth] = useState(() => buildRentalReportingWeeks(operations.expenses).at(-1)?.month
    || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }).slice(0, 7));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [activity, setActivity] = useState("all");
  const rentalRows = useMemo(() => selectRentals(rentals, query, status), [rentals, query, status]);
  const equipmentRows = useMemo(() => selectEquipment(equipment, query, status).filter((item) => activity === "all" || String(item.is_active) === activity), [equipment, query, status, activity]);
  const pagination = useTablePagination<GmeaRental | RentalEquipment>(view === "rentals" ? rentalRows : equipmentRows, JSON.stringify([view, query, status, activity]));
  return <section aria-label="Rental and equipment records" className={styles.panel}>
    <WorkspaceTabSwitch label="Rental workspace sections" className={styles.filterTabs} items={[{ value: "income", label: "Rental Income" }, { value: "expenses", label: "Rental Expenses" }, { value: "rentals", label: "Rental Bookings", count: rentals.length }, { value: "equipment", label: "Equipment", count: equipment.length }]} value={view} onChange={(value) => { setView(value); setQuery(""); setStatus("all"); setActivity("all"); }} />
    {view === "income" ? <GmeaRentalIncomeWorkspace state={incomeState} /> : view === "expenses" ? <GmeaRentalExpensesWorkspace
      operations={operations} rentals={rentals} canEdit={!!onEditEquipment} view={expenseView} onViewChange={setExpenseView}
      month={expenseMonth} onMonthChange={setExpenseMonth} /> : <>
    <div className="px-4 pt-4 sm:px-5"><GmeaRentalsSummary rentals={rentals} equipment={equipment} /></div>
    <div className={styles.filters}>
      <label className={`${styles.field} ${styles.searchField}`}>{view === "rentals" ? "Search rentals" : "Search equipment"}<input type="search" data-search-field className={styles.control} value={query} onChange={event => setQuery(event.target.value)} placeholder={view === "rentals" ? "Rental number, client, or location" : "Equipment, asset code, or plate"} /></label>
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
    {view === "rentals" ? <RentalRecordsTable rentals={pagination.pageRows as GmeaRental[]} hasRentals={rentals.length > 0} canEdit={!!onEditEquipment} /> : <EquipmentRecordsTable equipment={pagination.pageRows as RentalEquipment[]} onEdit={onEditEquipment} onDeactivate={onDeactivateEquipment} pending={pending} />}
    <WorkspaceListPagination {...pagination} total={view === "rentals" ? rentalRows.length : equipmentRows.length} noun={view === "rentals" ? "rentals" : "units"} label="Rental workspace" />
    </>}
  </section>;
}
