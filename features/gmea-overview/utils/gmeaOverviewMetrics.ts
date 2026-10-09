import { sumMoney } from "@/features/gmea-projects/utils/gmeaCalculations";
import type { GmeaOverviewMetric, GmeaOverviewMetricTotals, GmeaOverviewRecord } from "../types";

export const GMEA_OVERVIEW_METRICS = [
  { id: "ongoing", label: "Ongoing projects / rentals", hint: "Current work in progress", description: "Ongoing projects and active rentals. Completed, draft, and cancelled records are excluded." },
  { id: "revenue", label: "Total revenue", hint: "Project contracts + rental payments", description: "Project contract amounts before contract tax, plus posted rental payments. Includes ongoing and completed work; rental charges awaiting payment are not included in revenue." },
  { id: "expenses", label: "Total expenses", hint: "After recorded refunds", description: "All project and rental expenses, including VAT and shared rental costs, less recorded refunds." },
  { id: "profit", label: "Total profit", hint: "Positive results by record", description: "Positive results from individual projects and rentals. Project results use contracts before tax less expenses; rental results use posted payments less assigned expenses. This includes estimated project profit, rather than cash collected alone." },
  { id: "loss", label: "Total loss", hint: "Negative results shown separately", description: "Negative results from individual projects and rentals, shown as positive loss amounts. Shared rental costs are included separately so they do not disappear into profitable work. Total profit minus total loss equals the net result." },
  { id: "collected", label: "Total collected", hint: "Posted payments received", description: "Posted project receipts and rental payments, including payments on completed or cancelled records. Voided payments are excluded." },
  { id: "uncollected", label: "Not collected", hint: "Outstanding client balances", description: "Unpaid project contracts including contract tax, plus non-cancelled rental charges. Overpayments on one record do not reduce another record’s balance." },
  { id: "collection-rate", label: "Collection rate", hint: "Payments against total receivables", description: "Collected amounts applied to each contract or rental charge ÷ total receivables. Credit is capped at each record’s receivable; cancelled rental charges and excess payments are excluded. Project contracts include contract tax." },
] as const satisfies readonly { id: GmeaOverviewMetric; label: string; hint: string; description: string }[];

export function isGmeaOverviewMetric(value: string): value is GmeaOverviewMetric {
  return GMEA_OVERVIEW_METRICS.some((metric) => metric.id === value);
}

export function overviewRecordValue(record: GmeaOverviewRecord, metric: GmeaOverviewMetric) {
  switch (metric) {
    case "ongoing": return record.status === "active" ? 1 : 0;
    case "revenue": return record.revenue;
    case "expenses": return record.expenses;
    case "profit": return Math.max(0, record.result);
    case "loss": return Math.max(0, -record.result);
    case "collected": return record.collected;
    case "uncollected": return record.notCollected;
    case "collection-rate": return record.receivable > 0 ? record.creditedCollection / record.receivable * 100 : 0;
  }
}

export function buildGmeaOverviewMetricTotals(records: GmeaOverviewRecord[]): GmeaOverviewMetricTotals {
  const receivable = sumMoney(records.map((record) => record.receivable));
  const credited = sumMoney(records.map((record) => record.creditedCollection));
  return {
    ongoing: records.filter((record) => record.status === "active").length,
    revenue: sumMoney(records.map((record) => record.revenue)),
    expenses: sumMoney(records.map((record) => record.expenses)),
    profit: sumMoney(records.map((record) => Math.max(0, record.result))),
    loss: sumMoney(records.map((record) => Math.max(0, -record.result))),
    collected: sumMoney(records.map((record) => record.collected)),
    uncollected: sumMoney(records.map((record) => record.notCollected)),
    "collection-rate": receivable > 0 ? credited / receivable * 100 : 0,
  };
}

export function selectGmeaOverviewMetricRecords(records: GmeaOverviewRecord[], metric: GmeaOverviewMetric, query = "", division = "all") {
  const search = query.trim().toLocaleLowerCase();
  return records.filter((record) => {
    const included = metric === "collection-rate" ? record.receivable > 0 : overviewRecordValue(record, metric) !== 0;
    return included && (division === "all" || record.division === division)
      && [record.name, record.client, record.division].some((value) => value.toLocaleLowerCase().includes(search));
  }).sort((a, b) => overviewRecordValue(b, metric) - overviewRecordValue(a, metric) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

export function formatOverviewMetric(value: number, metric: GmeaOverviewMetric) {
  if (metric === "ongoing") return value.toLocaleString("en-PH");
  if (metric === "collection-rate") return value.toLocaleString("en-PH", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
