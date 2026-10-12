import { useMemo, useState } from "react";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import { selectPortfolioProjects } from "../utils/projectPortfolioSelectors";
import type { ProjectRecord, ProjectStatus } from "../types";

export type EngineerProjectSort = "updated" | "progress_high" | "progress_low" | "name";

export function useEngineerProjectPortfolio(projects: ProjectRecord[]) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");
  const [sort, setSort] = useState<EngineerProjectSort>("updated");
  const rows = useMemo(() => selectPortfolioProjects(projects, { status, search, sort }), [projects, search, sort, status]);
  const pagination = useTablePagination(rows, JSON.stringify([status, search, sort]));
  const tabs = ([
    { value: "all", label: "All projects" },
    { value: "planning", label: "Pending estimates" },
    { value: "active", label: "Active" },
    { value: "on_hold", label: "On hold" },
    { value: "completed", label: "Completed" },
  ] as const).map(tab => ({ ...tab, count: tab.value === "all" ? projects.length : projects.filter(project => project.status === tab.value).length }));
  function reset() { setSearch(""); setStatus("all"); setSort("updated"); }
  return { search, setSearch, status, setStatus, sort, setSort, rows, pagination, tabs, reset, hasFilters: search !== "" || status !== "all" || sort !== "updated" };
}
