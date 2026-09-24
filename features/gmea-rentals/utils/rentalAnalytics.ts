import type {
  GmeaRental,
  RentalEquipment,
  RentalExpense,
  RentalExpenseCategory,
  RentalPayment,
} from "../types";
import { rentalVatBreakdown } from "./expenseCalculations";

export type RentalAnalyticsData = {
  rentals: GmeaRental[];
  equipment: RentalEquipment[];
  expenses: RentalExpense[];
  categories: RentalExpenseCategory[];
  payments: RentalPayment[];
};

export type DateRange = { start: string; end: string };

const money = (value: number) => Math.round(value * 100) / 100;

export function paidRevenue(payments: RentalPayment[]) {
  return money(
    payments
      .filter((payment) => payment.status === "posted")
      .reduce((total, payment) => total + payment.amount, 0),
  );
}

export function expenseTotal(expenses: RentalExpense[]) {
  return money(
    expenses.reduce(
      (total, expense) =>
        total +
        rentalVatBreakdown(expense.amount, expense.vat_mode, expense.vat_rate)
          .gross -
        expense.refunded_amount,
      0,
    ),
  );
}

export function equipmentStatusCounts(equipment: RentalEquipment[]) {
  return {
    available: equipment.filter(
      (item) => item.is_active && item.status === "available",
    ).length,
    onRental: equipment.filter((item) => item.status === "on_rental").length,
    maintenance: equipment.filter((item) => item.status === "maintenance")
      .length,
  };
}

function categoryBucket(name: string) {
  const normalized = name.toLowerCase();
  if (normalized === "diesel/fuel" || normalized === "gasoline") return "fuel";
  if (normalized === "maintenance") return "maintenance";
  if (normalized === "repair" || normalized === "parts") return "repairParts";
  if (["driver", "operator", "labor"].includes(normalized)) return "labor";
  if (normalized === "cash advance") return "cashAdvance";
  return "miscellaneous";
}

export function expenseBreakdown(
  expenses: RentalExpense[],
  categories: RentalExpenseCategory[],
) {
  const names = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const totals = {
    fuel: 0,
    maintenance: 0,
    repairParts: 0,
    labor: 0,
    cashAdvance: 0,
    miscellaneous: 0,
  };
  expenses.forEach((expense) => {
    const bucket = categoryBucket(
      names.get(expense.category_id) ?? "Miscellaneous",
    );
    totals[bucket] +=
      rentalVatBreakdown(expense.amount, expense.vat_mode, expense.vat_rate)
        .gross - expense.refunded_amount;
  });
  return Object.fromEntries(
    Object.entries(totals).map(([key, value]) => [key, money(value)]),
  ) as typeof totals;
}

export function withinDateRange(date: string, range: DateRange) {
  return date >= range.start && date <= range.end;
}

export function reportSummary(data: RentalAnalyticsData, range: DateRange) {
  const payments = data.payments.filter((payment) =>
    withinDateRange(payment.payment_date, range),
  );
  const expenses = data.expenses.filter((expense) =>
    withinDateRange(expense.date, range),
  );
  const revenue = paidRevenue(payments);
  const totalExpenses = expenseTotal(expenses);
  return {
    revenue,
    totalExpenses,
    net: money(revenue - totalExpenses),
    expenses: expenseBreakdown(expenses, data.categories),
  };
}

export function equipmentProfitability(data: RentalAnalyticsData) {
  return data.equipment
    .map((equipment) => {
      const revenue = money(
        data.rentals
          .filter((rental) => rental.status !== "cancelled")
          .flatMap((rental) => rental.items)
          .filter((item) => item.equipment_id === equipment.id)
          .reduce((total, item) => total + item.subtotal, 0),
      );
      const expenses = expenseTotal(
        data.expenses.filter(
          (expense) => expense.equipment_id === equipment.id,
        ),
      );
      return {
        equipment,
        revenue,
        expenses,
        profit: money(revenue - expenses),
      };
    })
    .filter((item) => item.revenue || item.expenses)
    .sort(
      (a, b) =>
        b.profit - a.profit || a.equipment.name.localeCompare(b.equipment.name),
    );
}

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function currentWeekRange(now = new Date()): DateRange {
  const date = new Date(now);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  const start = isoDate(date);
  date.setDate(date.getDate() + 6);
  return { start, end: isoDate(date) };
}

export function currentMonthRange(now = new Date()): DateRange {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: isoDate(start), end: isoDate(end) };
}
