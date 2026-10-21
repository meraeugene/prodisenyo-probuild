import type { RentalExpense } from "@/features/gmea-rentals/types";
import { encodeRentalWorkbookWeekNotes } from "@/features/gmea-rentals/utils/rentalWorkbookWeeks";
import type { RentalWeekSection } from "@/features/gmea-rentals/utils/rentalReportingWeeks";
const row = (index: number, date: string, party: string, description: string, amount: number, section: RentalWeekSection = "equipment", later = false): RentalExpense => ({
  id: `weekly-${index}`, rental_id: null, equipment_id: null, category_id: "fuel", date, description, amount, supplier: section === "equipment" ? "" : party,
  method: "", invoice_number: "", refunded_amount: 0, vat_mode: "off", vat_rate: 0, version: 1, created_at: `${date}T08:00:00Z`, updated_at: `${date}T08:00:00Z`,
  notes: encodeRentalWorkbookWeekNotes("", { month: "2026-01", start: later ? "2026-01-26" : "2026-01-05", end: later ? "2026-01-31" : "2026-01-10",
    label: later ? "JAN 26-31,2026" : "JAN 05-10,2026", block: later ? "B69" : "B6", section,
    kind: description.startsWith("13th") ? "13th-month" : section, party, order: index * 100,
    source: { sheet: "JAN WEEKLY", cell: `E${index + 1}`, sha256: "a".repeat(64) } }),
});
export const weeklyRentalExpenses = [
  row(1, "2026-01-05", "Canter", "Diesel", 2000), row(2, "2026-01-06", "Bongo", "Diesel", 1000),
  row(3, "2026-01-07", "Yellow Dump", "Maintenance", 6000), row(4, "2026-01-07", "Backhoe XCMG", "Maintenance", 6500),
  row(5, "2026-01-08", "Backhoe Volvo", "Maintenance", 15130), row(6, "2026-01-08", "Canter", "Diesel", 2000), row(7, "2026-01-08", "Bongo", "Diesel", 1000),
  row(8, "2026-01-10", "Canter", "Diesel", 2000), row(9, "2026-01-10", "Backhoe XCMG", "Maintenance", 4300), row(10, "2026-01-10", "Bongo", "Diesel", 1000),
  row(11, "2026-01-03", "REMARK", "13th Month - REMARK", 500, "salary"), row(12, "2026-01-03", "RICHIE", "13th Month - RICHIE", 500, "salary"),
  row(13, "2026-01-07", "DRIVERS", "Cash Advance - DRIVERS", 500, "cash-advance"), row(14, "2026-01-07", "OPERATORS", "Cash Advance - OPERATORS", 1000, "cash-advance"),
  row(15, "2026-01-10", "DRIVERS", "Salary - DRIVERS", 2078.13, "salary"), row(16, "2026-01-10", "OPERATORS", "Salary - OPERATORS", 6312.19, "salary"),
  row(17, "2026-01-30", "Canter", "Diesel", 500, "equipment", true), row(18, "2026-01-31", "DRIVERS", "Salary - DRIVERS", 100, "salary", true),
];
