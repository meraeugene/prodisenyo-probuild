import type { GmeaMutation, GmeaProject } from "../types";
import { paymentTermSummary } from "./gmeaCalculations";

/** Imported source entries are trusted server data, never client supplied totals. */
export function protectWorkbookBalances(command: GmeaMutation, project: GmeaProject): GmeaMutation {
  if (command.kind === "expense" || command.kind === "delete") {
    const id = command.kind === "expense" ? command.value.id : command.id;
    if (project.expenses.some((expense) => expense.id === id && expense.workbook_balance)) {
      throw new Error("Workbook balance entries retain their source history and cannot be edited or deleted.");
    }
    const existing = project.expenses.find((expense) => expense.id === id);
    if (command.kind === "expense" && existing?.workbook_source) {
      return { ...command, value: { ...command.value, workbook_source: existing.workbook_source,
        workbook_items: existing.workbook_items, workbook_import_delta: existing.workbook_import_delta,
        source_previous_values: existing.source_previous_values } };
    }
  }
  if (command.kind === "record_receipt") {
    const term = project.payment_terms.find((item) => item.id === command.value.term_id);
    if (!term || command.value.amount > paymentTermSummary(term).balance) {
      throw new Error("Receipt amount exceeds the payment term balance.");
    }
  }
  if (command.kind !== "contract_terms") return command;
  for (const term of project.payment_terms) {
    if (!term.imported_receipts?.length) continue;
    const next = command.value.payment_terms.find((item) => item.id === term.id);
    if (!next || next.amount < paymentTermSummary(term).received) {
      throw new Error("Keep payment terms with imported collections and their received amounts.");
    }
  }
  return {
    ...command,
    value: {
      ...command.value,
      payment_terms: command.value.payment_terms.map((term) => ({
        ...term,
        imported_receipts: project.payment_terms.find((item) => item.id === term.id)?.imported_receipts ?? [],
        summary_source: project.payment_terms.find((item) => item.id === term.id)?.summary_source,
      })),
    },
  };
}
