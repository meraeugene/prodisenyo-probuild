import type { ProjectRecord, ProjectStatus } from "../types";
import { selectPortfolioProjects } from "./projectPortfolioSelectors";

export type CeoProjectSort = "latest" | "name" | "budget" | "spent" | "progress" | "endDate";
export const CEO_PROJECT_FILTERS: { value: "all" | ProjectStatus; label: string }[] = [
  { value: "all", label: "All projects" }, { value: "active", label: "Active" },
  { value: "planning", label: "Pending estimates" }, { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
];

export function selectCeoProjectPortfolio(projects: ProjectRecord[], filters: {
  status: "all" | ProjectStatus; search: string; location: string;
  sort: CeoProjectSort; direction: "asc" | "desc";
}) {
  const rows = selectPortfolioProjects(projects, { ...filters, sort: "name", searchEngineer: true });
  return rows.sort((left, right) => {
    const difference = filters.sort === "name" ? left.name.localeCompare(right.name)
      : filters.sort === "latest" ? Date.parse(left.startDate) - Date.parse(right.startDate)
      : filters.sort === "endDate" ? Date.parse(left.endDate) - Date.parse(right.endDate)
      : left[filters.sort] - right[filters.sort];
    return (Number.isNaN(difference) ? 0 : difference) * (filters.direction === "asc" ? 1 : -1) || left.id.localeCompare(right.id);
  });
}
