"use client";

import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import styles from "@/components/workspace/workspace.module.css";
import { sumRentalReportingMonth, type RentalReportingWeek } from "../utils/rentalReportingWeeks";
import { isRentalChartMonth } from "../utils/rentalChartSelectors";
import { formatRentalMoney } from "../utils/rentalUi";
import RentalExpenseCharts from "./RentalExpenseCharts";

export default function RentalExpenseAnalytics({ weeks, month, onMonthChange }: {
  weeks: RentalReportingWeek[]; month: string; onMonthChange: (month: string) => void;
}) {
  const monthly = weeks.filter(week => week.month === month);
  return <section aria-label="Rental expense analytics" className="space-y-4 p-4 sm:p-5">
    <header><h2 className="text-lg font-semibold">Rental expense analytics</h2>
      <p className="mt-1 text-sm text-slate-500">Spending trends and weekly breakdowns for the selected reporting month.</p></header>
    <label className={`${styles.field} max-w-xs`}>Month<input aria-label="Reporting month" type="month" className={styles.control} value={month} onChange={event => onMonthChange(event.target.value)} /></label>
    {isRentalChartMonth(month) ? <>
      <WorkspaceSummaryCards ariaLabel="Rental expense analytics totals" className="lg:grid-cols-3" cards={[
        { label: "Monthly total", value: formatRentalMoney(sumRentalReportingMonth(weeks, month)) },
        { label: "Reporting weeks", value: String(monthly.length) },
        { label: "Expense entries", value: String(monthly.reduce((sum, week) => sum + week.expenses.length, 0)) },
      ]} />
      <RentalExpenseCharts weeks={weeks} month={month} />
    </> : <p role="alert" className="text-sm text-rose-700">Choose a valid reporting month.</p>}
  </section>;
}
