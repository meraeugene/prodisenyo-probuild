import type { ContractPaymentTerm, GmeaProject } from "../types";
import { money, paymentTermSummary, projectSummary, sumMoney } from "./gmeaCalculations";

export function summaryPercentage(term: Pick<ContractPaymentTerm, "value_mode" | "percentage" | "display_percentage">) {
  return term.value_mode === "percentage" ? term.percentage : term.display_percentage ?? null;
}

export function collectedDates(term: ContractPaymentTerm) {
  return [...term.receipts.filter((receipt) => receipt.status === "posted"), ...(term.imported_receipts ?? [])]
    .map((receipt) => receipt.received_date)
    .filter((date, index, dates) => dates.indexOf(date) === index)
    .sort((a, b) => (a ?? "").localeCompare(b ?? ""));
}

export function formatSummaryDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-PH", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`)) : "Date not provided";
}

export function projectSummaryColumns(project: GmeaProject) {
  const [downPayment, ...completion] = project.payment_terms;
  const summary = projectSummary(project);
  return { ...summary, downPayment, completion,
    downScheduled: downPayment?.amount ?? 0,
    downPaid: downPayment ? paymentTermSummary(downPayment).received : 0,
    downOutstanding: downPayment ? paymentTermSummary(downPayment).balance : 0,
    completionPaid: sumMoney(completion.map((term) => paymentTermSummary(term).received)),
    completionOutstanding: sumMoney(completion.map((term) => paymentTermSummary(term).balance)),
  };
}

export function projectSummaryColumnTotals(projects: GmeaProject[]) {
  const rows = projects.map(projectSummaryColumns);
  const sum = (key: "contract" | "expenses" | "downScheduled" | "downPaid" | "downOutstanding" | "completionPaid" | "completionOutstanding") => sumMoney(rows.map((row) => row[key]));
  return { contract: sum("contract"), expenses: sum("expenses"), downScheduled: sum("downScheduled"), downPaid: sum("downPaid"),
    downOutstanding: sum("downOutstanding"), completionPaid: sum("completionPaid"), completionOutstanding: sum("completionOutstanding"),
    collected: sumMoney([sum("downPaid"), sum("completionPaid")]), net: money(sum("contract") - sum("expenses") - sumMoney(rows.map((row) => row.taxAmount))),
  };
}

export function orderProjectSummary(projects: GmeaProject[]) {
  const sourceRow = (project: GmeaProject) => Number(project.payment_terms[0]?.summary_source?.cells.match(/\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER);
  return [...projects].sort((left, right) => sourceRow(left) - sourceRow(right));
}
