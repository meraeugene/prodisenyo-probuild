import type { CustomerIncomeEntry } from "../customerIncomeTypes";
import type { RentalIncomeRecord } from "../incomeTypes";

export function mapCustomerIncomeEntry(entry: CustomerIncomeEntry): RentalIncomeRecord {
  const collected = entry.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return { id: entry.id, client: entry.client, location: entry.location, rental_number: `Income ${entry.id.slice(0, 8)}`,
    customerIncome: { version: entry.version }, status: collected >= entry.total_amount ? "completed" : "active",
    start_date: entry.payments.map(payment => payment.payment_date).sort()[0] || entry.created_at.slice(0, 10),
    items: [{ id: entry.id, equipment_id: "", equipment_name: entry.service || "Rental", rate_type: "fixed",
      unit_rate: Number(entry.total_amount), quantity: 1, subtotal: Number(entry.total_amount) }], payments: entry.payments };
}
