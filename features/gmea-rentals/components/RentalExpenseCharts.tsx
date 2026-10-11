"use client";

import { useMemo } from "react";
import type { RentalReportingWeek } from "../utils/rentalReportingWeeks";
import { buildRentalExpenseTrend, buildRentalExpenseWeeks } from "../utils/rentalChartSelectors";
import RentalBarChart from "./RentalBarChart";

const expenseSeries = [
  { key: "equipment", label: "Equipment", color: "#076d69" },
  { key: "cashAdvance", label: "Cash advances", color: "#69a99b" },
  { key: "salary", label: "Salaries", color: "#a66b12" },
];
export default function RentalExpenseCharts({ weeks, month }: { weeks: RentalReportingWeek[]; month: string }) {
  const trend = useMemo(() => buildRentalExpenseTrend(weeks, month), [weeks, month]);
  const weekly = useMemo(() => buildRentalExpenseWeeks(weeks, month), [weeks, month]);
  return <section aria-label="Rental expense charts" className="grid gap-4 xl:grid-cols-2">
    <RentalBarChart title="Expenses over six months" description="Reporting week totals, including VAT and less refunds, through the selected month." data={trend} series={[{ key: "total", label: "Expenses", color: "#076d69" }]} />
    <RentalBarChart title="Weekly expense breakdown" description="Weeks assigned to the selected reporting month. Missing entries are excluded from totals." data={weekly} series={expenseSeries} />
  </section>;
}
