import type { RentalIncomeRecord } from "../incomeTypes";
import type { RentalPayment, RentalExpense } from "../types";
import { rentalClientKey } from "./rentalIncomeSelectors";
import { rentalExpenseWeekMetadata } from "./rentalReportingWeeks";

export type RentalIncomeRow = { rental: RentalIncomeRecord; payment: RentalPayment | null };
export type RentalIncomeTab = "all" | "down_payment" | "full_payment" | "other";
export type RentalExpenseTab = "all" | "equipment" | "cash-advance" | "salary" | "general";
export function buildRentalIncomeRows(records: RentalIncomeRecord[]): RentalIncomeRow[] {
  return records.flatMap<RentalIncomeRow>(rental => {
    const payments = rental.payments.filter(payment => payment.status === "posted");
    return payments.length ? payments.map(payment => ({ rental, payment })) : [{ rental, payment: null }];
  });
}
export function selectRentalIncomeRows(rows: RentalIncomeRow[], tab: RentalIncomeTab, query: string, client: string, location: string) {
  const search = rentalClientKey(query);
  return rows.filter(({ rental, payment }) => (tab === "all" || (tab === "other"
    ? !payment || !["down_payment", "full_payment"].includes(payment.payment_type || "unclassified")
    : payment?.payment_type === tab))
    && (!client || rentalClientKey(rental.client) === client) && (!location || rentalClientKey(rental.location) === location)
    && [rental.client, rental.location, rental.rental_number, payment?.method || "", ...rental.items.map(item => item.equipment_name)]
      .some(value => rentalClientKey(value).includes(search)))
    .sort((left, right) => (right.payment?.payment_date || "").localeCompare(left.payment?.payment_date || "") || left.rental.id.localeCompare(right.rental.id));
}
export function getRentalExpenseType(expense: RentalExpense, categories: Map<string, string>): Exclude<RentalExpenseTab, "all"> {
  const week = rentalExpenseWeekMetadata(expense.notes);
  if (week) return week.section;
  const category = rentalClientKey(categories.get(expense.category_id) || "");
  if (category.includes("cash advance")) return "cash-advance";
  if (["salary", "salaries", "driver", "operator"].some(name => category.includes(name))) return "salary";
  return expense.equipment_id ? "equipment" : "general";
}
export const rentalExpenseTypeLabels = { equipment: "Equipment", "cash-advance": "Cash advance", salary: "Salary", general: "General" } as const;
