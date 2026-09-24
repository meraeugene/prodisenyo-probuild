import type { GmeaRental } from "../types";

export function rentalCollectionSummary(rental: GmeaRental) {
  const charge =
    Math.round(
      rental.items.reduce((sum, item) => sum + item.subtotal, 0) * 100,
    ) / 100;
  const received =
    Math.round(
      rental.payments
        .filter((payment) => payment.status === "posted")
        .reduce((sum, payment) => sum + payment.amount, 0) * 100,
    ) / 100;
  const balance = Math.max(0, Math.round((charge - received) * 100) / 100);
  const status =
    received <= 0 ? "Unpaid" : balance > 0 ? "Partially Paid" : "Paid";
  return { charge, received, balance, status };
}
