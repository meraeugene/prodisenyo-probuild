import type { RentalExpense } from "../types";
import { rentalVatBreakdown } from "./expenseCalculations";

export type RentalWeekSection = "equipment" | "cash-advance" | "salary";
export type RentalWeekMetadata = {
  month: string; start: string; end: string; section: RentalWeekSection; party: string; order?: number;
  source?: { sheet: string; cell: string; sha256: string }; pending?: RentalWeekSection[];
};
export type RentalReportingWeek = {
  id: string; month: string; start: string; end: string; expenses: RentalExpense[];
  equipment: number; cashAdvance: number; salary: number; total: number; pending: RentalWeekSection[];
};
const prefix = "@rental-week:";
const sections: RentalWeekSection[] = ["equipment", "cash-advance", "salary"];
const validDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0,10) === date;

export function validateRentalWeekMetadata(value: RentalWeekMetadata) {
  if (!value || !/^\d{4}-\d{2}$/.test(value.month) || !validDate(value.start) || !validDate(value.end) || value.start > value.end || value.start.slice(0,7) !== value.month
    || !sections.includes(value.section) || typeof value.party !== "string" || !value.party.trim() || value.party.length > 200
    || (value.order !== undefined && (!Number.isInteger(value.order) || value.order < 0))
    || (value.pending && (!Array.isArray(value.pending) || value.pending.some(section => !sections.includes(section))))
    || (value.source && (typeof value.source.sheet !== "string" || typeof value.source.cell !== "string" || !/^[a-f0-9]{64}$/.test(value.source.sha256)))) throw new Error("Enter a valid reporting month, week dates, and expense section.");
  return value;
}
export function rentalWeekMetadata(notes: string): RentalWeekMetadata | null {
  if (!notes.startsWith(prefix)) return null;
  try { return validateRentalWeekMetadata(JSON.parse(notes.slice(prefix.length).split("\n")[0])); } catch { return null; }
}
export function rentalExpenseUserNotes(notes: string) { return notes.startsWith(prefix) ? notes.includes("\n") ? notes.slice(notes.indexOf("\n") + 1) : "" : notes; }
export function encodeRentalWeekNotes(notes: string, week: RentalWeekMetadata) {
  return `${prefix}${JSON.stringify(validateRentalWeekMetadata(week))}\n${rentalExpenseUserNotes(notes)}`;
}
export const rentalReportingWeekId = (week: Pick<RentalWeekMetadata,"month"|"start"|"end">) => `${week.month}:${week.start}:${week.end}`;

export function buildRentalReportingWeeks(expenses: RentalExpense[]) {
  const groups = new Map<string, RentalReportingWeek>();
  for (const expense of expenses) {
    const metadata = rentalWeekMetadata(expense.notes);
    if (!metadata) continue;
    const id = rentalReportingWeekId(metadata);
    const week = groups.get(id) || { id, month: metadata.month, start: metadata.start, end: metadata.end, expenses: [], equipment: 0, cashAdvance: 0, salary: 0, total: 0, pending: [] };
    week.expenses.push(expense);
    const amount = Math.round((rentalVatBreakdown(expense.amount, expense.vat_mode, expense.vat_rate).gross - expense.refunded_amount) * 100);
    if (metadata.section === "equipment") week.equipment += amount;
    else if (metadata.section === "cash-advance") week.cashAdvance += amount;
    else week.salary += amount;
    week.total += amount;
    groups.set(id,week);
  }
  return [...groups.values()].sort((left,right) => left.start.localeCompare(right.start)).map(week => {
    week.pending = ["cash-advance", "salary"].filter(section => !week.expenses.some(expense => rentalWeekMetadata(expense.notes)?.section === section)) as RentalWeekSection[];
    week.expenses.sort((left,right) => (rentalWeekMetadata(left.notes)?.order ?? Number.MAX_SAFE_INTEGER) - (rentalWeekMetadata(right.notes)?.order ?? Number.MAX_SAFE_INTEGER) || left.date.localeCompare(right.date) || left.id.localeCompare(right.id));
    return { ...week, equipment: week.equipment/100, cashAdvance: week.cashAdvance/100, salary: week.salary/100, total: week.total/100 };
  });
}
export function sumRentalReportingMonth(weeks: RentalReportingWeek[], month: string) {
  return weeks.filter(week => week.month === month).reduce((sum,week) => sum + Math.round(week.total*100),0)/100;
}
export function nextRentalReportingWeek(month: string, weeks: RentalReportingWeek[]): RentalWeekMetadata {
  let start = `${month}-01`;
  const latest = weeks.filter(week => week.start < `${month}-32`).sort((left,right) => right.end.localeCompare(left.end))[0];
  if (latest && latest.end >= start) { const next = new Date(`${latest.end}T00:00:00Z`); next.setUTCDate(next.getUTCDate()+1); start = next.toISOString().slice(0,10); }
  const date = new Date(`${start}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + (8-date.getUTCDay())%7);
  const end = new Date(date); end.setUTCDate(end.getUTCDate()+5);
  return { month: date.toISOString().slice(0,7), start: date.toISOString().slice(0,10), end: end.toISOString().slice(0,10), section:"equipment", party:"Equipment" };
}
