import type { GmeaRental, RentalEquipment } from "../types";

export function selectRentals(rentals: GmeaRental[], query: string, status: string) {
  const search = query.trim().toLowerCase();
  return rentals.filter((rental) => (status === "all" || rental.status === status)
    && [rental.rental_number, rental.client, rental.location].some((value) => value.toLowerCase().includes(search)))
    .sort((left, right) => Date.parse(right.start_date) - Date.parse(left.start_date) || left.id.localeCompare(right.id));
}

export function selectEquipment(equipment: RentalEquipment[], query: string, status: string) {
  const search = query.trim().toLowerCase();
  return equipment.filter((item) => (status === "all" || item.status === status)
    && [item.name, item.code, item.equipment_type, item.plate_number].some((value) => value.toLowerCase().includes(search)))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function buildRentalAmounts(rental: GmeaRental) {
  const amount = rental.items.reduce((sum, item) => sum + item.subtotal, 0);
  const collected = rental.payments.filter((payment) => payment.status === "posted").reduce((sum, payment) => sum + payment.amount, 0);
  return { amount, collected, outstanding: Math.max(0, amount - collected) };
}
