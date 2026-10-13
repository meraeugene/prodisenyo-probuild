import type { GmeaDashboardData } from "../types";
import { contractCollectionSummary, expenseBreakdown, projectExpenseTotal, sumMoney } from "@/features/gmea-projects/utils/gmeaCalculations";
import { summarizeRentalPortfolio } from "@/features/gmea-rentals/utils/rentalPortfolioSelectors";
import { rentalVatBreakdown } from "@/features/gmea-rentals/utils/expenseCalculations";

export function buildGmeaDashboardSummary(data: GmeaDashboardData) {
  const rental = summarizeRentalPortfolio(data.rentalIncome, data.rentalExpenses);
  const projects = data.projects.map(contractCollectionSummary);
  const projectCollected = sumMoney(projects.map(row => row.received));
  const projectExpenses = sumMoney(data.projects.map(projectExpenseTotal));
  const operationExpenses = sumMoney(data.operationExpenses.map(row => row.amount));
  const collected = sumMoney([rental.collected, projectCollected]);
  const expenses = sumMoney([rental.expenses, projectExpenses, operationExpenses]);
  return { collected, expenses, net: sumMoney([collected, -expenses]), rentalCollected: rental.collected,
    projectCollected, rentalExpenses: rental.expenses, projectExpenses, operationExpenses,
    outstanding: sumMoney([rental.outstanding, ...projects.map(row => row.outstanding)]),
    rentalOutstanding: rental.outstanding, projectOutstanding: sumMoney(projects.map(row => row.outstanding)),
    downPayment: rental.downPayment, fullPayment: rental.fullPayment,
    activeProjects: data.projects.filter(row => row.status === "active").length,
    completedProjects: data.projects.filter(row => row.status === "completed").length,
    rentalCount: data.rentalIncome.length, locationCount: new Set(data.rentalIncome.map(row => row.location.trim().toLowerCase()).filter(Boolean)).size };
}

export function buildGmeaDashboardTrend(data: GmeaDashboardData, endingMonth: string, months = 12) {
  const ending = new Date(`${endingMonth}-01T00:00:00Z`);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(endingMonth) || !Number.isFinite(ending.getTime())) return [];
  const receipts = [
    ...data.rentalIncome.flatMap(row => row.payments.filter(payment => payment.status === "posted")
      .map(payment => ({ date: payment.payment_date, amount: payment.amount }))),
    ...data.projects.flatMap(project => project.payment_terms.flatMap(term => [
      ...term.receipts.filter(receipt => receipt.status === "posted").map(receipt => ({ date: receipt.received_date, amount: receipt.amount })),
      ...(term.imported_receipts ?? []).map(receipt => ({ date: receipt.received_date || "", amount: receipt.amount })),
    ])),
  ];
  const costs = [
    ...data.rentalExpenses.map(row => ({ date: row.date, amount: rentalVatBreakdown(row.amount, row.vat_mode, row.vat_rate).gross - row.refunded_amount })),
    ...data.operationExpenses.map(row => ({ date: row.date, amount: row.amount })),
    ...data.projects.flatMap(project => project.expenses.map(row => ({ date: row.date, amount: expenseBreakdown(row).gross }))),
  ];
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(ending.getUTCFullYear(), ending.getUTCMonth() - months + 1 + index, 1));
    const key = date.toISOString().slice(0, 7);
    const collected = sumMoney(receipts.filter(row => row.date.slice(0, 7) === key).map(row => row.amount));
    const expenses = sumMoney(costs.filter(row => row.date.slice(0, 7) === key).map(row => row.amount));
    return { key, label: date.toLocaleDateString("en-PH", { month: "short", year: "2-digit", timeZone: "UTC" }), collected, expenses, net: sumMoney([collected, -expenses]) };
  });
}
