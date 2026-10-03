import type { CeoDashboardProject, CeoPortfolioFilter } from "../types";

export function selectCeoPortfolioProjects(projects: CeoDashboardProject[], filter: CeoPortfolioFilter) {
  return projects.filter((project) => filter === "all" ||
    (filter === "on-track" ? ["active", "completed"].includes(project.status) : project.status === "on_hold"));
}

export const CEO_PROJECT_STATUS_LABELS = { active: "On Track", completed: "Completed", planning: "Planning", on_hold: "At Risk" } as const;
export const CEO_PROJECT_STATUS_STYLES = { active: "text-teal-700", completed: "text-teal-700", planning: "text-amber-700", on_hold: "text-amber-700" } as const;
