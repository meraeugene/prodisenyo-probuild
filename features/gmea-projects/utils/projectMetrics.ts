import type { GmeaProject } from "../types";
import { contractCollectionSummary, projectSummary, sumMoney } from "./gmeaCalculations";

export const PROJECT_METRICS = [
  { id: "ongoing", label: "Ongoing projects", hint: "Current work in progress", description: "Projects currently ongoing. Completed projects remain included in the financial totals." },
  { id: "revenue", label: "Total revenue", hint: "Project contracts before tax", description: "Contract amounts before project tax, including ongoing and completed projects. This is contract revenue, rather than cash collected." },
  { id: "expenses", label: "Total expenses", hint: "Recorded project costs", description: "Project expenses including VAT. Reimbursements to Sir Edward do not reduce project costs." },
  { id: "profit", label: "Total profit", hint: "Positive results by project", description: "Positive project results: contracts before tax less expenses. Estimated profit includes ongoing and completed work." },
  { id: "loss", label: "Total loss", hint: "Negative results shown separately", description: "Losses on individual projects, shown as positive amounts. Total profit minus total loss equals the net project result." },
  { id: "collected", label: "Total collected", hint: "Project payments received", description: "Posted project receipts and imported collections. Voided payments are excluded." },
  { id: "uncollected", label: "Not collected", hint: "Outstanding project balances", description: "Contract amounts including project tax less collected payments. Overpayments on one project do not reduce another project's balance." },
  { id: "collection-rate", label: "Collection rate", hint: "Payments against project receivables", description: "Payments applied to each project divided by total contract receivables, including project tax. Overpayments are capped at each project's receivable." },
] as const;
export type ProjectMetric = typeof PROJECT_METRICS[number]["id"];
export type ProjectMetricRecord = ReturnType<typeof buildProjectMetricRecords>[number];
export function isProjectMetric(value: string): value is ProjectMetric {
  return PROJECT_METRICS.some(metric => metric.id === value);
}

export function buildProjectMetricRecords(projects: GmeaProject[]) {
  return projects.map(project => {
    const summary = projectSummary(project), collection = contractCollectionSummary(project);
    return { project, revenue: summary.baseContract, expenses: summary.expenses, result: summary.profit,
      profit: Math.max(0, summary.profit), loss: Math.max(0, -summary.profit),
      collected: collection.received, uncollected: collection.outstanding, receivable: summary.contract,
      credited: Math.min(summary.contract, collection.received),
    };
  });
}

export function projectMetricValue(record: ProjectMetricRecord, metric: ProjectMetric) {
  if (metric === "ongoing") return record.project.status === "active" ? 1 : 0;
  if (metric === "collection-rate") return record.receivable > 0 ? record.credited / record.receivable * 100 : 0;
  return record[metric];
}

export function buildProjectMetricTotals(records: ProjectMetricRecord[]): Record<ProjectMetric, number> {
  const receivable = sumMoney(records.map(record => record.receivable));
  return Object.fromEntries(PROJECT_METRICS.map(metric => [metric.id,
    metric.id === "ongoing" ? records.filter(record => record.project.status === "active").length
      : metric.id === "collection-rate" ? receivable > 0 ? sumMoney(records.map(record => record.credited)) / receivable * 100 : 0
      : sumMoney(records.map(record => projectMetricValue(record, metric.id))),
  ])) as Record<ProjectMetric, number>;
}

export function selectProjectMetricRecords(records: ProjectMetricRecord[], metric: ProjectMetric, query = "") {
  const search = query.trim().toLocaleLowerCase();
  return records.filter(record => (metric === "collection-rate" ? record.receivable > 0 : projectMetricValue(record, metric) !== 0)
    && [record.project.title, record.project.name, record.project.client, record.project.location].some(value => (value || "").toLocaleLowerCase().includes(search)))
    .sort((left, right) => projectMetricValue(right, metric) - projectMetricValue(left, metric) || left.project.title.localeCompare(right.project.title) || left.project.id.localeCompare(right.project.id));
}

export function formatProjectMetric(value: number, metric: ProjectMetric) {
  if (metric === "ongoing") return value.toLocaleString("en-PH");
  if (metric === "collection-rate") return value.toLocaleString("en-PH", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function projectMetricDetailColumns(metric: ProjectMetric): { label: string; field: "revenue" | "expenses" | "result" | "receivable" | "collected" | "uncollected" | "metric" }[] {
  const definition = PROJECT_METRICS.find(item => item.id === metric)!;
  if (metric === "ongoing") return [{ label: "Contract", field: "revenue" }, { label: "Expenses", field: "expenses" }, { label: "Collected", field: "collected" }];
  if (metric === "revenue") return [{ label: "Collected", field: "collected" }, { label: "Outstanding", field: "uncollected" }, { label: "Contract", field: "metric" }];
  if (metric === "expenses") return [{ label: "Contract", field: "revenue" }, { label: "Net result", field: "result" }, { label: "Expenses", field: "metric" }];
  if (metric === "collected" || metric === "uncollected" || metric === "collection-rate") return [
    { label: "Contract incl. tax", field: "receivable" },
    metric === "collected" ? { label: "Outstanding", field: "uncollected" } : { label: "Collected", field: "collected" },
    { label: definition.label, field: "metric" },
  ];
  return [{ label: "Contract", field: "revenue" }, { label: "Expenses", field: "expenses" }, { label: definition.label, field: "metric" }];
}
