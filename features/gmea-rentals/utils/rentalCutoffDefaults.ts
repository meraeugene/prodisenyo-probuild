import type { RentalWeekMetadata } from "./rentalReportingWeeks";

export function buildRentalCutoffDefault(date: string, section: RentalWeekMetadata["section"]): RentalWeekMetadata {
  const value = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(value.getTime()) || value.toISOString().slice(0, 10) !== date) throw new Error("Enter a valid expense date before setting a cutoff.");
  value.setUTCDate(value.getUTCDate() - (value.getUTCDay() + 6) % 7);
  const start = value.toISOString().slice(0, 10);
  value.setUTCDate(value.getUTCDate() + 6);
  return { start, end: value.toISOString().slice(0, 10), month: start.slice(0, 7), section, party: section === "equipment" ? "Equipment" : "Drivers" };
}
