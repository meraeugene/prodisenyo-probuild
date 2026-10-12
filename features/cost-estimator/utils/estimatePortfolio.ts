import type { AssignedEstimateProject, ProjectEstimateItemRow, ProjectEstimateRow } from "../types";

export const ESTIMATE_PORTFOLIO_TABS = [
  { value: "all", label: "All projects" },
  { value: "not_started", label: "Not started" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Returned" },
] as const;
export type EstimatePortfolioStatus = (typeof ESTIMATE_PORTFOLIO_TABS)[number]["value"];
export type EstimatePortfolioSort = "recent" | "name" | "cost";

export function buildEstimatePortfolio(estimates: ProjectEstimateRow[], projects: AssignedEstimateProject[], itemsByEstimateId: Record<string, ProjectEstimateItemRow[]>) {
  const projectsById = new Map(projects.map(project => [project.id, project]));
  const estimatedProjectIds = new Set(estimates.map(estimate => estimate.project_id));
  return [
    ...projects.filter(project => !estimatedProjectIds.has(project.id)).map(project => ({ id: project.id, project, estimate: null, items: [] as ProjectEstimateItemRow[], name: project.name, location: project.location, status: "not_started" as const, cost: null, updatedAt: "" })),
    ...estimates.map(estimate => ({ id: estimate.id, project: estimate.project_id ? projectsById.get(estimate.project_id) ?? null : null, estimate, items: itemsByEstimateId[estimate.id] ?? [], name: estimate.project_name, location: estimate.location || projectsById.get(estimate.project_id ?? "")?.location || "", status: estimate.status, cost: Number(estimate.estimate_total ?? 0), updatedAt: estimate.updated_at })),
  ];
}
export type EstimatePortfolioEntry = ReturnType<typeof buildEstimatePortfolio>[number];

export function selectEstimatePortfolio(entries: EstimatePortfolioEntry[], status: EstimatePortfolioStatus, query: string, sort: EstimatePortfolioSort) {
  const normalizedQuery = query.trim().toLowerCase();
  return entries.filter(entry => (status === "all" || entry.status === status) && `${entry.name} ${entry.location}`.toLowerCase().includes(normalizedQuery))
    .sort((left, right) => sort === "name" ? left.name.localeCompare(right.name) : sort === "cost" ? (right.cost ?? 0) - (left.cost ?? 0) : Date.parse(right.updatedAt || "1970-01-01") - Date.parse(left.updatedAt || "1970-01-01"));
}

export function countEstimateBoqItems(items: ProjectEstimateItemRow[]) {
  return new Set(items.map(item => `${(item.boq_section || "General Works").toLowerCase()}::${(item.boq_item_number || String(item.sort_order + 1)).toLowerCase()}`)).size;
}
