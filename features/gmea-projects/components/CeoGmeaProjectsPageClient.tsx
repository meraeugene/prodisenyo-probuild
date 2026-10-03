"use client";

import { useMemo, useState } from "react";
import TablePagination from "@/components/TablePagination";
import CeoGmeaProjectFilters from "./CeoGmeaProjectFilters";
import { CEO_PROJECT_PAGE_SIZE, type CeoProjectTab } from "../utils/ceoProjectFilters";
import useSWR from "swr";
import { getGmeaProjectsDataAction } from "@/actions/gmeaProjects";
import type { GmeaProject } from "../types";
import { buildCeoPortfolio, getCollectionStatus } from "../utils/ceoPortfolio";
import { filterPortfolioProjects, selectPortfolioClients } from "../utils/gmeaPortfolioFilters";
import { projectSummary } from "../utils/gmeaCalculations";
import CeoGmeaCharts from "./CeoGmeaCharts";
import CeoGmeaProjectsTable from "./CeoGmeaProjectsTable";
import CeoGmeaSummary from "./CeoGmeaSummary";
import GmeaPortfolioHero from "./GmeaPortfolioHero";


export default function CeoGmeaProjectsPageClient({ projects }: { projects: GmeaProject[] }) {
  const { data: liveProjects = projects } = useSWR("gmea-projects:list", getGmeaProjectsDataAction, {
    fallbackData: projects,
    revalidateOnFocus: false,
    refreshInterval: 30000,
  });
  const [months, setMonths] = useState(6);
  const [selectedPage, setPage] = useState(1);
  const [tab, setTab] = useState<CeoProjectTab>("Active");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("latest");
  const activeProjects = useMemo(() => liveProjects.filter((project) => project.status === "active"), [liveProjects]);
  const completedProjects = useMemo(() => liveProjects.filter((project) => project.status === "completed"), [liveProjects]);
  const portfolioProjects = tab === "Completed" ? completedProjects : tab === "All Projects" ? liveProjects : activeProjects;
  const data = useMemo(() => buildCeoPortfolio(portfolioProjects, months), [portfolioProjects, months]);
  const clients = useMemo(() => selectPortfolioClients(liveProjects), [liveProjects]);
  const tabCounts = useMemo(() => ({
    "All Projects": liveProjects.length,
    Active: activeProjects.length,
    Completed: completedProjects.length,
    "On Track": activeProjects.filter((project) => getCollectionStatus(project) === "Fully collected").length,
    "At Risk": activeProjects.filter((project) => project.contract_amount > 0 && projectSummary(project).profit < 0).length,
    "For Collection": activeProjects.filter((project) => ["Uncollected", "Partially collected"].includes(getCollectionStatus(project))).length,
  }), [activeProjects, completedProjects.length, liveProjects.length]);
  const visible = useMemo(() => {
    const filtered = filterPortfolioProjects(liveProjects, query, filter).filter((project) => {
      if (tab === "Active") return project.status === "active";
      if (tab === "Completed") return project.status === "completed";
      if (tab === "All Projects") return true;
      if (project.status !== "active") return false;
      if (tab === "On Track") return getCollectionStatus(project) === "Fully collected";
      if (tab === "At Risk") return project.contract_amount > 0 && projectSummary(project).profit < 0;
      if (tab === "For Collection") return ["Uncollected", "Partially collected"].includes(getCollectionStatus(project));
      return true;
    });
    return filtered.sort((left, right) =>
      sort === "name"
        ? left.name.localeCompare(right.name)
        : sort === "contract"
          ? projectSummary(right).contract - projectSummary(left).contract
          : Date.parse(right.created_at) - Date.parse(left.created_at),
    );
  }, [filter, liveProjects, query, sort, tab]);

  const totalPages = Math.max(1, Math.ceil(visible.length / CEO_PROJECT_PAGE_SIZE));
  const page = Math.min(selectedPage, totalPages);
  const pageProjects = visible.slice((page - 1) * CEO_PROJECT_PAGE_SIZE, page * CEO_PROJECT_PAGE_SIZE);

  return (
    <div className="min-h-screen bg-white/40 p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <GmeaPortfolioHero canEdit={false} />
        <CeoGmeaSummary
          count={portfolioProjects.length}
          contract={data.contract}
          expenses={data.expenses}
          outstanding={data.outstanding}
          trend={data.trend}
        />
        <CeoGmeaCharts data={data} count={portfolioProjects.length} months={months} onMonthsChange={setMonths} />

        <section aria-label="Projects" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <CeoGmeaProjectFilters
            tab={tab} tabCounts={tabCounts} query={query} filter={filter} sort={sort} clients={clients}
            onTabChange={(value) => { setTab(value); setPage(1); }}
            onQueryChange={(value) => { setQuery(value); setPage(1); }}
            onFilterChange={(value) => { setFilter(value); setPage(1); }}
            onSortChange={(value) => { setSort(value); setPage(1); }}
          />
          <CeoGmeaProjectsTable projects={pageProjects} totalProjects={visible} />
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-4 py-4">
            <p aria-live="polite" className="text-sm text-slate-500">
              Showing {visible.length ? (page - 1) * CEO_PROJECT_PAGE_SIZE + 1 : 0}–{Math.min(page * CEO_PROJECT_PAGE_SIZE, visible.length)} of {visible.length} projects
            </p>
            <TablePagination page={page} totalPages={totalPages} onChange={setPage} label="Project table pages" />
          </div>
        </section>
      </div>
    </div>
  );
}
