import type { RentalWeekMetadata, RentalWeekSection } from "./rentalReportingWeeks";

export type RentalWorkbookWeekMetadata = RentalWeekMetadata & {
  label: string;
  block: string;
  kind: RentalWeekSection | "13th-month";
  source: { sheet: string; cell: string; sha256: string };
};

const prefix = "@rental-workbook-week:";
const validDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date)
  && Number.isFinite(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;

export function validateRentalWorkbookWeek(value: RentalWorkbookWeekMetadata) {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value.month) || !validDate(value.start) || !validDate(value.end)
    || value.start > value.end || ![value.start.slice(0, 7), value.end.slice(0, 7)].includes(value.month)
    || !["equipment", "cash-advance", "salary"].includes(value.section)
    || !["equipment", "cash-advance", "salary", "13th-month"].includes(value.kind)
    || value.kind !== value.section && !(value.kind === "13th-month" && value.section === "salary")
    || typeof value.party !== "string" || !value.party.trim() || value.party.length > 200
    || typeof value.label !== "string" || !value.label || value.label.length > 200
    || !/^[A-Z]{1,3}[1-9]\d*$/.test(value.block) || !Number.isInteger(value.order) || Number(value.order) < 0
    || !value.source || typeof value.source.sheet !== "string" || !/WEEK/i.test(value.source.sheet)
    || !/^[A-Z]{1,3}[1-9]\d*$/.test(value.source.cell) || !/^[a-f0-9]{64}$/.test(value.source.sha256)) {
    throw new Error("Invalid workbook reporting week.");
  }
  return value;
}

export function rentalWorkbookWeekMetadata(notes: string): RentalWorkbookWeekMetadata | null {
  const line = notes.split("\n").find(line => line.startsWith(prefix));
  if (!line) return null;
  try { return validateRentalWorkbookWeek(JSON.parse(line.slice(prefix.length))); } catch { return null; }
}

export function stripRentalWorkbookWeekNotes(notes: string) {
  return notes.split("\n").filter(line => !line.startsWith(prefix)).join("\n");
}

export function encodeRentalWorkbookWeekNotes(notes: string, week: RentalWorkbookWeekMetadata) {
  const original = stripRentalWorkbookWeekNotes(notes).trim();
  return `${original}${original ? "\n" : ""}${prefix}${JSON.stringify(validateRentalWorkbookWeek(week))}`;
}

export function preserveRentalWorkbookWeekNotes(original: string, notes: string) {
  const week = rentalWorkbookWeekMetadata(original);
  return week ? encodeRentalWorkbookWeekNotes(notes, week) : notes;
}
