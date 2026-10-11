import type { RentalExpense } from "@/features/gmea-rentals/types";
import { encodeRentalWeekNotes } from "@/features/gmea-rentals/utils/rentalReportingWeeks";

const expense = (id: string, overrides: Partial<RentalExpense>): RentalExpense => ({
  id, rental_id: null, equipment_id: null, category_id: "fuel", date: "2026-10-05", description: "Diesel", supplier: "Fuel station", method: "Cash", invoice_number: "",
  amount: 1000, refunded_amount: 0, vat_mode: "off", vat_rate: 0, notes: "", version: 1, created_at: "2026-10-05T08:00:00Z", updated_at: "2026-10-05T08:00:00Z", ...overrides,
});
const october = { month: "2026-10", start: "2026-10-05", end: "2026-10-10", party: "Equipment" };
export const rentalExpenses = [
  expense("fuel-oct", { amount: 1000, vat_mode: "exclusive", vat_rate: 12, refunded_amount: 120,
    notes: encodeRentalWeekNotes("", { ...october, section: "equipment" }) }),
  expense("advance-oct", { amount: 200, description: "Driver advance", notes: encodeRentalWeekNotes("", { ...october, section: "cash-advance", party: "Drivers" }) }),
  expense("salary-oct", { amount: 300, description: "Driver salary", notes: encodeRentalWeekNotes("", { ...october, section: "salary", party: "Drivers" }) }),
  expense("fuel-sep", { date: "2026-10-02", amount: 2000, vat_mode: "exclusive", vat_rate: 12, refunded_amount: 160,
    notes: encodeRentalWeekNotes("", { month: "2026-09", start: "2026-09-28", end: "2026-10-03", section: "equipment", party: "Equipment" }) }),
];
