import type { GmeaProject } from "../types";
import { projectSummary } from "./gmeaCalculations";

export function selectPortfolioClients(projects: GmeaProject[]) {
  return [...new Set(projects.map((project) => project.client.trim()).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
}

export function filterPortfolioProjects(projects: GmeaProject[], query: string, filter: string) {
  const search = query.trim().toLowerCase();
  return projects.filter((project) => {
    if (![project.name, project.client, project.location].join(" ").toLowerCase().includes(search)) {
      return false;
    }
    if (filter.startsWith("client:")) return project.client.trim() === filter.slice(7);
    switch (filter) {
      case "with-expenses": return project.expenses.length > 0;
      case "without-expenses": return project.expenses.length === 0;
      case "over-contract": {
        const summary = projectSummary(project);
        return summary.expenses > summary.contract;
      }
      case "missing-client": return !project.client.trim();
      case "new": return project.expenses.some((expense) => expense.is_new);
      default: return true;
    }
  });
}
