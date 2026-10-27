import type { OperationExpense, OperationExpensePeriod } from "../types";
import { rentalExpensePeriodRange } from "@/features/gmea-rentals/utils/rentalExpensePeriods";

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const dayLabel = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "UTC" });

export function buildOperationExpenseTrend(rows: OperationExpense[], period: OperationExpensePeriod, anchor: string) {
  if (period === "all") {
    const totals = new Map<string, number>();
    for (const row of rows) {
      const month = row.date.slice(0, 7);
      totals.set(month, (totals.get(month) ?? 0) + Math.round(row.amount * 100));
    }
    return [...totals.keys()].sort().map(month => {
      const start = `${month}-01`;
      const range = rentalExpensePeriodRange("month", start)!;
      const label = new Date(`${start}T00:00:00Z`).toLocaleDateString("en-PH", { month: "short", year: "numeric", timeZone: "UTC" });
      return { ...range, label, amount: totals.get(month)! / 100 };
    });
  }
  const range = rentalExpensePeriodRange(period, anchor);
  if (!range) return [];
  const buckets: { start: string; end: string; label: string; amount: number }[] = [];
  const cursor = new Date(`${range.start}T00:00:00Z`);
  while (isoDate(cursor) <= range.end) {
    const start = isoDate(cursor), endDate = new Date(cursor);
    if (period === "month") endDate.setUTCDate(endDate.getUTCDate() + (7 - endDate.getUTCDay()) % 7);
    const end = isoDate(endDate) > range.end ? range.end : isoDate(endDate);
    const amount = rows.filter(row => row.date >= start && row.date <= end).reduce((sum, row) => sum + Math.round(row.amount * 100), 0) / 100;
    buckets.push({ start, end, label: start === end ? dayLabel(start) : `${dayLabel(start)} – ${dayLabel(end)}`, amount });
    cursor.setTime(new Date(`${end}T00:00:00Z`).getTime());
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return buckets;
}
