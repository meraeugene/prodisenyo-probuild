import { useMemo, useState } from "react";
import useSWR from "swr";
import { getGmeaProjectsDataAction } from "@/actions/gmeaProjects";
import { useCeoTablePagination } from "@/features/ceo-workspace/hooks/useCeoTablePagination";
import type { GmeaProject } from "../types";
import { buildCeoPortfolio, getCollectionStatus } from "../utils/ceoPortfolio";
import { filterPortfolioProjects, selectPortfolioClients } from "../utils/gmeaPortfolioFilters";
import { projectSummary } from "../utils/gmeaCalculations";
import type { CeoProjectTab } from "../utils/ceoProjectFilters";
import { sortCeoGmeaProjects, type CeoGmeaSort } from "../utils/ceoPortfolioSorting";

export function useCeoGmeaPortfolio(projects: GmeaProject[]) {
  const { data: liveProjects = projects } = useSWR("gmea-projects:list", getGmeaProjectsDataAction, {
    fallbackData: projects, revalidateOnFocus: false, refreshInterval: 30000,
  });
  const [months, setMonths] = useState(6);
  const [tab, setTab] = useState<CeoProjectTab>("Active");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<CeoGmeaSort>("latest");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const activeProjects = useMemo(() => liveProjects.filter((project) => project.status === "active"), [liveProjects]);
  const completedProjects = useMemo(() => liveProjects.filter((project) => project.status === "completed"), [liveProjects]);
  const portfolioProjects = tab === "Completed" ? completedProjects : tab === "All Projects" ? liveProjects : activeProjects;
  const data = useMemo(() => buildCeoPortfolio(portfolioProjects, months), [portfolioProjects, months]);
  const clients = useMemo(() => selectPortfolioClients(liveProjects), [liveProjects]);
  const tabCounts = useMemo(() => ({
    "All Projects": liveProjects.length, Active: activeProjects.length, Completed: completedProjects.length,
    "On Track": activeProjects.filter((project) => getCollectionStatus(project) === "Fully collected").length,
    "At Risk": activeProjects.filter((project) => project.contract_amount > 0 && projectSummary(project).profit < 0).length,
    "For Collection": activeProjects.filter((project) => ["Uncollected", "Partially collected"].includes(getCollectionStatus(project))).length,
  }), [activeProjects, completedProjects.length, liveProjects.length]);
  const visible = useMemo(() => {
    const filtered = filterPortfolioProjects(liveProjects, query, filter).filter((project) => {
      if (tab === "All Projects") return true;
      if (tab === "Completed") return project.status === "completed";
      if (project.status !== "active") return false;
      if (tab === "On Track") return getCollectionStatus(project) === "Fully collected";
      if (tab === "At Risk") return project.contract_amount > 0 && projectSummary(project).profit < 0;
      if (tab === "For Collection") return ["Uncollected", "Partially collected"].includes(getCollectionStatus(project));
      return true;
    });
    return sortCeoGmeaProjects(filtered, sort, direction);
  }, [liveProjects, query, filter, tab, sort, direction]);
  const pagination = useCeoTablePagination(visible, JSON.stringify([tab, query, filter, sort, direction]));
  function changeSort(value: CeoGmeaSort) {
    setSort(value); setDirection(value === "name" ? "asc" : "desc");
  }
  function toggleSort(value: CeoGmeaSort) {
    if (sort === value) setDirection(direction === "asc" ? "desc" : "asc");
    else changeSort(value);
  }
  function reset() {
    setTab("Active"); setQuery(""); setFilter("all"); setSort("latest"); setDirection("desc");
  }
  return { months, setMonths, tab, setTab, query, setQuery, filter, setFilter, sort, direction, changeSort, toggleSort, portfolioProjects, data, clients, tabCounts, visible, pagination, reset,
    hasFilters: tab !== "Active" || query !== "" || filter !== "all" || sort !== "latest" || direction !== "desc" };
}
