import type { GmeaProject } from "../types";
import { contractCollectionSummary, projectSummary } from "./gmeaCalculations";

export type CeoGmeaSort = "latest" | "name" | "contract" | "expenses" | "collected" | "outstanding";

export function sortCeoGmeaProjects(projects: GmeaProject[], sort: CeoGmeaSort, direction: "asc" | "desc") {
  const rows = projects.map((project) => ({ project, summary: projectSummary(project), collection: contractCollectionSummary(project) }));
  return rows.sort((left, right) => {
    const difference = sort === "name" ? left.project.name.localeCompare(right.project.name)
      : sort === "latest" ? Date.parse(left.project.created_at) - Date.parse(right.project.created_at)
      : sort === "collected" ? left.collection.received - right.collection.received
      : sort === "outstanding" ? left.collection.outstanding - right.collection.outstanding
      : left.summary[sort] - right.summary[sort];
    return (Number.isNaN(difference) ? 0 : difference) * (direction === "asc" ? 1 : -1) || left.project.id.localeCompare(right.project.id);
  }).map(({ project }) => project);
}
