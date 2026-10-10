"use client";

import type { GmeaRental, RentalOperationsData } from "../types";
import WorkspaceTabSwitch from "@/components/workspace/WorkspaceTabSwitch";
import GmeaRentalExpenseLedger from "./GmeaRentalExpenseLedger";
import GmeaRentalWeeklyReports from "./GmeaRentalWeeklyReports";

export default function GmeaRentalExpensesWorkspace({ operations, rentals, canEdit, view, onViewChange, month, onMonthChange }: {
  operations: RentalOperationsData; rentals: GmeaRental[]; canEdit: boolean;
  view: "monthly" | "weekly" | "history"; onViewChange: (view: "monthly" | "weekly" | "history") => void;
  month: string; onMonthChange: (month: string) => void;
}) {
  return <section aria-label="Rental expense workspace">
    <div className="px-4 pt-4 sm:px-5"><WorkspaceTabSwitch label="Rental expense views" value={view} onChange={onViewChange}
      items={[{ value: "monthly", label: "Monthly Overview" }, { value: "weekly", label: "Weekly" }, { value: "history", label: "History" }]} /></div>
    {view === "history" ? <GmeaRentalExpenseLedger operations={operations} rentals={rentals} canEdit={canEdit} initialPeriod="all" historical />
      : <GmeaRentalWeeklyReports operations={operations} canEdit={canEdit} view={view} onViewWeek={() => onViewChange("weekly")}
        reportingMonth={month} onReportingMonthChange={onMonthChange} />}
  </section>;
}
