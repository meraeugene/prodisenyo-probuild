import type { ProjectRecord, ProjectStatus } from "../types";

export function selectPortfolioProjects(projects: ProjectRecord[], options: {
  status: "all" | ProjectStatus;
  search: string;
  location?: string;
  searchEngineer?: boolean;
  sort: string;
}) {
  const query = options.search.trim().toLowerCase();
  return projects.filter(project =>
    (options.status === "all" || project.status === options.status) &&
    (!options.location || options.location === "all" || project.location === options.location) &&
    (!query || [project.name, project.location, ...(options.searchEngineer ? [project.engineer] : [])].some(value => value.toLowerCase().includes(query))),
  ).sort((left, right) => {
    if (options.sort === "name") return left.name.localeCompare(right.name);
    if (options.sort === "budget") return right.budget - left.budget;
    if (options.sort === "progress_high") return right.progress - left.progress;
    if (options.sort === "progress_low") return left.progress - right.progress;
    const field = options.sort === "latest" ? "startDate" : "endDate";
    return Date.parse(right[field]) - Date.parse(left[field]);
  });
}

export function formatPortfolioDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
