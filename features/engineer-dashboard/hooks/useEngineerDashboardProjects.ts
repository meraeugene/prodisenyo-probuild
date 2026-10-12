import { useMemo, useState } from "react";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import type { EngineerDashboardProject } from "../types";

export function useEngineerDashboardProjects(projects: EngineerDashboardProject[], selectedProjectId: string) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const rows = useMemo(() => projects
    .filter(project => selectedProjectId === "all" || project.id === selectedProjectId)
    .filter(project => `${project.name} ${project.location}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((left, right) => sort === "name" ? left.name.localeCompare(right.name) : sort === "progress" ? right.progress - left.progress : Date.parse(right.startDate) - Date.parse(left.startDate)), [projects, query, selectedProjectId, sort]);
  const pagination = useTablePagination(rows, JSON.stringify([query, selectedProjectId, sort]));
  return { query, setQuery, sort, setSort, rows, pagination };
}
