import type { GmeaRental } from "../types";
import type { RentalIncomeRecord } from "../incomeTypes";
import { selectRentalIncomeTransactions, summarizeRentalIncome } from "./rentalIncomeSelectors";
import type { RentalReportingWeek } from "./rentalReportingWeeks";

export type RentalChartPoint = { label: string; [key: string]: string | number };
export const isRentalChartMonth = (month: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month);

export function rentalChartMonths(month: string, count = 6) {
  if (!isRentalChartMonth(month)) return [];
  const [year, number] = month.split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, number - count + index, 1));
    return { month: date.toISOString().slice(0, 7), label: date.toLocaleDateString("en-PH", { month: "short", year: "2-digit", timeZone: "UTC" }) };
  });
}

export function buildRentalIncomeTrend(rentals: RentalIncomeRecord[], month: string): RentalChartPoint[] {
  return rentalChartMonths(month).map(point => ({ label: point.label, ...summarizeRentalIncome(selectRentalIncomeTransactions(rentals, point.month)) }));
}

export function buildRentalIncomeDays(rentals: RentalIncomeRecord[], month: string): RentalChartPoint[] {
  if (!isRentalChartMonth(month)) return [];
  const transactions = selectRentalIncomeTransactions(rentals, month);
  const [year, number] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return Array.from({ length: days }, (_, index) => ({
    label: String(index + 1),
    collected: summarizeRentalIncome(transactions.filter(row => Number(row.payment.payment_date.slice(8, 10)) === index + 1)).collected,
  }));
}

export function buildRentalExpenseWeeks(weeks: RentalReportingWeek[], month: string): RentalChartPoint[] {
  return weeks.filter(week => week.month === month).map(week => ({
    label: week.start.slice(5) + " – " + week.end.slice(5), equipment: week.equipment, cashAdvance: week.cashAdvance, salary: week.salary,
  }));
}

export function buildRentalExpenseTrend(weeks: RentalReportingWeek[], month: string): RentalChartPoint[] {
  return rentalChartMonths(month).map(point => ({ label: point.label,
    total: weeks.filter(week => week.month === point.month).reduce((sum, week) => sum + Math.round(week.total * 100), 0) / 100,
  }));
}

export function buildRentalBookingTrend(rentals: GmeaRental[], month: string): RentalChartPoint[] {
  return rentalChartMonths(month).map(point => {
    const rows = rentals.filter(rental => rental.start_date.slice(0, 7) === point.month);
    return { label: point.label, draft: rows.filter(row => row.status === "draft").length,
      active: rows.filter(row => row.status === "active").length, completed: rows.filter(row => row.status === "completed").length,
      cancelled: rows.filter(row => row.status === "cancelled").length };
  });
}
