import type { GmeaOverviewMetric, GmeaOverviewRecord } from "../types";

type FinancialField = "revenue" | "expenses" | "receivable" | "collected" | "creditedCollection" | "notCollected" | "result" | "metric";
export type GmeaOverviewDetailColumn = { label: string; field: FinancialField };

export function overviewDetailColumns(metric: GmeaOverviewMetric): GmeaOverviewDetailColumn[] {
  if (metric === "profit" || metric === "loss") return [
    { label: "Revenue", field: "revenue" }, { label: "Expenses", field: "expenses" },
    { label: metric === "profit" ? "Profit" : "Loss", field: "metric" },
  ];
  if (metric === "collection-rate") return [
    { label: "Receivable", field: "receivable" }, { label: "Applied collections", field: "creditedCollection" },
    { label: "Collection rate", field: "metric" },
  ];
  if (metric === "collected" || metric === "uncollected") return [
    { label: "Receivable", field: "receivable" }, { label: "Collected", field: "collected" },
    { label: "Not collected", field: "notCollected" },
  ];
  if (metric === "expenses") return [
    { label: "Revenue", field: "revenue" }, { label: "Expenses", field: "expenses" },
    { label: "Net result", field: "result" },
  ];
  return [
    { label: "Revenue", field: "revenue" }, { label: "Collected", field: "collected" },
    { label: "Not collected", field: "notCollected" },
  ];
}

export function overviewRecordStatus(record: GmeaOverviewRecord) {
  return { active: "Ongoing", completed: "Completed", draft: "Draft", cancelled: "Cancelled", shared: "Shared costs" }[record.status];
}
