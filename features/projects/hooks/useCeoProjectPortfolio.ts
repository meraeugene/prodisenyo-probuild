import { useMemo, useState } from "react";
import { useCeoTablePagination } from "@/features/ceo-workspace/hooks/useCeoTablePagination";
import { CEO_PROJECT_FILTERS, selectCeoProjectPortfolio, type CeoProjectSort } from "../utils/ceoProjectPortfolio";
import type { ProjectRecord, ProjectStatus } from "../types";

export function useCeoProjectPortfolio(projects: ProjectRecord[]) {
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("all");
  const [sort, setSort] = useState<CeoProjectSort>("latest");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const locations = useMemo(() => [...new Set(projects.map((project) => project.location).filter(Boolean))].sort(), [projects]);
  const rows = useMemo(() => selectCeoProjectPortfolio(projects, { status, search: query, location, sort, direction }), [projects, status, query, location, sort, direction]);
  const pagination = useCeoTablePagination(rows, JSON.stringify([status, query, location, sort, direction]));
  function changeSort(value: CeoProjectSort) {
    setSort(value);
    setDirection(value === "name" || value === "endDate" ? "asc" : "desc");
  }
  function toggleSort(value: CeoProjectSort) {
    if (sort === value) setDirection(direction === "asc" ? "desc" : "asc");
    else changeSort(value);
  }
  function reset() {
    setStatus("all"); setQuery(""); setLocation("all"); setSort("latest"); setDirection("desc");
  }
  return {
    status, setStatus, query, setQuery, location, setLocation, sort, direction, changeSort, toggleSort, locations, rows, pagination, reset,
    hasFilters: status !== "all" || query !== "" || location !== "all" || sort !== "latest" || direction !== "desc",
    tabs: CEO_PROJECT_FILTERS.map((item) => ({ ...item, count: item.value === "all" ? projects.length : projects.filter((project) => project.status === item.value).length })),
  };
}
