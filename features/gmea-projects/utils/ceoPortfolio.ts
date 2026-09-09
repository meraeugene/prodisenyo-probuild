import type { GmeaProject } from "../types";
import { contractCollectionSummary, projectSummary, sumMoney, vatBreakdown } from "./gmeaCalculations";

export type CollectionStatus = "Uncollected" | "Partially collected" | "Fully collected" | "No contract amount";

export function getCollectionStatus(project: GmeaProject): CollectionStatus {
  const collection = contractCollectionSummary(project);
  if (project.contract_amount <= 0) return "No contract amount";
  if (collection.received <= 0) return "Uncollected";
  return collection.outstanding > 0 ? "Partially collected" : "Fully collected";
}

export const collectionColors: Record<CollectionStatus, string> = {
  "Uncollected": "#f5c95e",
  "Partially collected": "#087d76",
  "Fully collected": "#9de3db",
  "No contract amount": "#cbd5e1",
};

export function buildCeoPortfolio(projects: GmeaProject[], months: number) {
  const summaries = projects.map(projectSummary);
  const collections = projects.map(contractCollectionSummary);
  const statuses = (Object.keys(collectionColors) as CollectionStatus[]).map((name) => ({
    name, value: projects.filter((project) => getCollectionStatus(project) === name).length,
    color: collectionColors[name],
  }));
  const locations = new Map<string, number>();
  projects.forEach((project) => {
    const location = project.location.trim() || "Location not set";
    locations.set(location, (locations.get(location) ?? 0) + 1);
  });
  const now = new Date();
  const trend = Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - months + index + 1, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      month: date.toLocaleDateString("en", { month: "short", year: "2-digit" }),
      contract: sumMoney(projects.filter((project) => project.created_at.startsWith(key)).map((project) => project.contract_amount)),
      expenses: sumMoney(projects.flatMap((project) => project.expenses)
        .filter((expense) => expense.date.startsWith(key))
        .map((expense) => vatBreakdown(expense.amount, expense.vat_mode, expense.vat_rate).gross)),
    };
  });
  return {
    contract: sumMoney(summaries.map((summary) => summary.contract)),
    expenses: sumMoney(summaries.map((summary) => summary.expenses)),
    outstanding: sumMoney(collections.map((collection) => collection.outstanding)),
    statuses, trend,
    locations: [...locations].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
  };
}

export function selectCeoActivity(projects: GmeaProject[]) {
  return projects.flatMap((project) => [
    { id: `project:${project.id}`, projectId: project.id, project: project.name, title: "Project added", date: project.created_at, kind: "project" },
    ...project.expenses.map((expense) => ({
      id: `expense:${expense.id}`, projectId: project.id, project: project.name,
      title: expense.description || "Project expense", date: expense.date, kind: "expense",
    })),
    ...project.payment_terms.flatMap((term) => term.receipts.map((receipt) => ({
      id: `receipt:${receipt.id}`, projectId: project.id, project: project.name,
      title: receipt.status === "voided" ? "Payment voided" : "Payment recorded",
      date: receipt.voided_at ?? receipt.recorded_at, kind: "payment",
    }))),
  ]).filter((event) => Number.isFinite(Date.parse(event.date)))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export function formatCompactPeso(value: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", notation: "compact", maximumFractionDigits: 1 }).format(value);
}
