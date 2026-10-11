"use client";

import { useMemo, useState } from "react";
import { buildRentalReportingWeeks } from "../utils/rentalReportingWeeks";
import type { GmeaRental, RentalOperationsData } from "../types";
import WorkspaceTabSwitch from "@/components/workspace/WorkspaceTabSwitch";
import GmeaRentalExpenseLedger from "./GmeaRentalExpenseLedger";
import GmeaRentalWeeklyReports from "./GmeaRentalWeeklyReports";
import RentalExpenseAnalytics from "./RentalExpenseAnalytics";

export default function GmeaRentalExpensesWorkspace({ operations, rentals, canEdit }: {
  operations: RentalOperationsData; rentals: GmeaRental[]; canEdit: boolean;

}) {
  const [view, onViewChange] = useState<"monthly" | "weekly" | "history" | "analytics">("monthly");
  const weeks = useMemo(() => buildRentalReportingWeeks(operations.expenses), [operations.expenses]);
  const [month, onMonthChange] = useState(() => buildRentalReportingWeeks(operations.expenses).at(-1)?.month
    || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }).slice(0, 7));
  return <section aria-label="Rental expense workspace">
    <div className="px-4 pt-4 sm:px-5"><WorkspaceTabSwitch label="Rental expense views" value={view} onChange={onViewChange}
      items={[{ value: "monthly", label: "Monthly Overview" }, { value: "weekly", label: "Weekly" }, { value: "history", label: "History" }, { value: "analytics", label: "Analytics" }]} /></div>
    {view === "analytics" ? <RentalExpenseAnalytics weeks={weeks} month={month} onMonthChange={onMonthChange} />
      : view === "history" ? <GmeaRentalExpenseLedger operations={operations} rentals={rentals} canEdit={canEdit} initialPeriod="all" historical />
      : <GmeaRentalWeeklyReports operations={operations} canEdit={canEdit} view={view} onViewWeek={() => onViewChange("weekly")}
        reportingMonth={month} onReportingMonthChange={onMonthChange} />}
  </section>;
}
