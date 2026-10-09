import { contractCollectionSummary, projectContractBreakdown, sumMoney, vatBreakdown } from "@/features/gmea-projects/utils/gmeaCalculations";
import { expenseTotal, paidRevenue } from "@/features/gmea-rentals/utils/rentalAnalytics";
import type { RentalExpense, RentalPayment } from "@/features/gmea-rentals/types";
import type { GmeaOverviewData, GmeaOverviewRecord } from "../types";

function groupRentalEntries<T extends { rental_id: string | null }>(entries: T[]) {
  const grouped = new Map<string | null, T[]>();
  entries.forEach((entry) => {
    const key = entry.rental_id ?? null;
    const group = grouped.get(key) ?? [];
    group.push(entry);
    grouped.set(key, group);
  });
  return grouped;
}

export function buildGmeaOverviewRecords(data: GmeaOverviewData): GmeaOverviewRecord[] {
  const projects: GmeaOverviewRecord[] = data.projects.map((project) => {
    const collection = contractCollectionSummary(project);
    const receivable = projectContractBreakdown(project).totalContract;
    const expenses = sumMoney(project.expenses.map((expense) =>
      vatBreakdown(expense.amount, expense.vat_mode, expense.vat_rate).gross - expense.refunded_amount));
    return {
      id: "project:" + project.id, name: project.title, client: project.client,
      division: "Projects Expenses", kind: "project", status: project.status,
      href: "/gmea-projects/" + project.id,
      revenue: project.contract_amount, expenses,
      result: sumMoney([project.contract_amount, -expenses]),
      collected: collection.received, notCollected: collection.outstanding, receivable,
      creditedCollection: Math.min(receivable, collection.received),
    };
  });
  const payments = groupRentalEntries(data.rentals.payments);
  const expenses = groupRentalEntries(data.rentals.expenses);
  const rentals: GmeaOverviewRecord[] = data.rentals.rentals.map((rental) => {
    const collected = paidRevenue(payments.get(rental.id) ?? []);
    const costs = expenseTotal(expenses.get(rental.id) ?? []);
    // Cancelled charges are no longer receivable, but their actual payments/costs remain recorded.
    const receivable = rental.status === "cancelled" ? 0 : sumMoney(rental.items.map((item) => item.subtotal));
    payments.delete(rental.id);
    expenses.delete(rental.id);
    return {
      id: "rental:" + rental.id, name: rental.rental_number, client: rental.client,
      division: "Rentals", kind: "rental", status: rental.status,
      href: "/gmea-rentals/" + rental.id,
      revenue: collected, expenses: costs, result: sumMoney([collected, -costs]),
      collected, receivable, notCollected: Math.max(0, sumMoney([receivable, -collected])),
      creditedCollection: Math.min(receivable, collected),
    };
  });
  // Equipment and general expenses need not be assigned to a particular rental.
  const sharedExpenses: RentalExpense[] = [...expenses.values()].flat();
  const unmatchedPayments: RentalPayment[] = [...payments.values()].flat();
  const sharedCosts = expenseTotal(sharedExpenses);
  const sharedRevenue = paidRevenue(unmatchedPayments);
  const shared: GmeaOverviewRecord[] = sharedExpenses.length || unmatchedPayments.length ? [{
    id: "rental:shared", name: "Shared rental costs / unassigned payments", client: "—",
    division: "Rentals", kind: "shared", status: "shared", href: sharedExpenses.length ? "/gmea-rentals/expenses" : "/gmea-rentals",
    revenue: sharedRevenue, expenses: sharedCosts, result: sumMoney([sharedRevenue, -sharedCosts]),
    collected: sharedRevenue, notCollected: 0, receivable: 0, creditedCollection: 0,
  }] : [];
  return [...projects, ...rentals, ...shared];
}
