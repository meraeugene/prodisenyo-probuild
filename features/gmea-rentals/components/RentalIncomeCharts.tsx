"use client";

import { useMemo } from "react";
import type { RentalIncomeRecord } from "../incomeTypes";
import { buildRentalIncomeDays, buildRentalIncomeTrend } from "../utils/rentalChartSelectors";
import RentalBarChart from "./RentalBarChart";

const paymentSeries = [
  { key: "downPayment", label: "Down Payment", color: "#076d69" },
  { key: "fullPayment", label: "Full Payment", color: "#69a99b" },
  { key: "otherPayments", label: "Other collections", color: "#a66b12" },
];
export default function RentalIncomeCharts({ rentals, month }: { rentals: RentalIncomeRecord[]; month: string }) {
  const trend = useMemo(() => buildRentalIncomeTrend(rentals, month), [rentals, month]);
  const daily = useMemo(() => buildRentalIncomeDays(rentals, month), [rentals, month]);
  return <section aria-label="Rental income charts" className="grid gap-4 xl:grid-cols-2">
    <RentalBarChart title="Collections over six months" description="Posted receipts through the selected month, using the current income filters." data={trend} series={paymentSeries} />
    <RentalBarChart title="Daily collections" description="Collections by payment date in the selected income month." data={daily} series={[{ key: "collected", label: "Collected", color: "#076d69" }]} />
  </section>;
}
