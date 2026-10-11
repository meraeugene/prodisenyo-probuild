"use client";

import { useMemo, useState } from "react";
import type { GmeaRental } from "../types";
import { buildRentalBookingTrend, isRentalChartMonth } from "../utils/rentalChartSelectors";
import styles from "@/components/workspace/workspace.module.css";
import RentalBarChart from "./RentalBarChart";

const statusSeries = [
  { key: "active", label: "Active", color: "#076d69" },
  { key: "completed", label: "Completed", color: "#69a99b" },
  { key: "draft", label: "Draft", color: "#a66b12" },
  { key: "cancelled", label: "Cancelled", color: "#b45361" },
];
export default function RentalBookingCharts({ rentals }: { rentals: GmeaRental[] }) {
  const [month, setMonth] = useState(() => rentals.map(row => row.start_date.slice(0, 7)).sort().at(-1)
    || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }).slice(0, 7));
  const trend = useMemo(() => buildRentalBookingTrend(rentals, month), [rentals, month]);
  return <section aria-label="Rental booking charts" className="space-y-3">
    <label className={styles.field}>Chart through month<input type="month" aria-label="Booking chart month" className={styles.control} value={month} onChange={event => setMonth(event.target.value)} /></label>
    {isRentalChartMonth(month) ? <RentalBarChart title="Bookings over six months" description="Booking counts by rental start month and current status, using the booking search and status filters." data={trend} series={statusSeries} money={false} />
      : <p role="alert" className="text-sm text-rose-700">Choose a valid booking chart month.</p>}
  </section>;
}
