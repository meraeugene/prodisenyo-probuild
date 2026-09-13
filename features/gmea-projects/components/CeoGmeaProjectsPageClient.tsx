"use client";

import { useMemo, useState } from "react";
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

const tabs = ["All Projects", "On Track", "At Risk", "For Collection"] as const;
const controlClass = "h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function CeoGmeaProjectsPageClient({ projects }: { projects: GmeaProject[] }) {
  const { data: liveProjects = projects } = useSWR("gmea-projects:list", getGmeaProjectsDataAction, {
    fallbackData: projects,
    revalidateOnFocus: false,
    refreshInterval: 30000,
  });
  const [months, setMonths] = useState(6);
  const [tab, setTab] = useState<(typeof tabs)[number]>("All Projects");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("latest");
  const data = useMemo(() => buildCeoPortfolio(liveProjects, months), [liveProjects, months]);
  const clients = useMemo(() => selectPortfolioClients(liveProjects), [liveProjects]);
  const tabCounts = useMemo(() => ({
    "All Projects": liveProjects.length,
    "On Track": liveProjects.filter((project) => getCollectionStatus(project) === "Fully collected").length,
    "At Risk": liveProjects.filter((project) => project.contract_amount > 0 && projectSummary(project).expenses > project.contract_amount).length,
    "For Collection": liveProjects.filter((project) => ["Uncollected", "Partially collected"].includes(getCollectionStatus(project))).length,
  }), [liveProjects]);
  const visible = useMemo(() => {
    const filtered = filterPortfolioProjects(liveProjects, query, filter).filter((project) => {
      if (tab === "On Track") return getCollectionStatus(project) === "Fully collected";
      if (tab === "At Risk") return project.contract_amount > 0 && projectSummary(project).expenses > project.contract_amount;
      if (tab === "For Collection") return ["Uncollected", "Partially collected"].includes(getCollectionStatus(project));
      return true;
    });
    return filtered.sort((left, right) =>
      sort === "name"
        ? left.name.localeCompare(right.name)
        : sort === "contract"
          ? right.contract_amount - left.contract_amount
          : Date.parse(right.created_at) - Date.parse(left.created_at),
    );
  }, [filter, liveProjects, query, sort, tab]);

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <GmeaPortfolioHero canEdit={false} />
        <CeoGmeaSummary
          count={liveProjects.length}
          contract={data.contract}
          expenses={data.expenses}
          outstanding={data.outstanding}
          trend={data.trend}
        />
        <CeoGmeaCharts data={data} count={liveProjects.length} months={months} onMonthsChange={setMonths} />

        <section aria-label="Projects" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
            <nav aria-label="Filter projects by status" className="flex max-w-full gap-1 overflow-x-auto">
              {tabs.map((name) => (
                <button key={name} onClick={() => setTab(name)} aria-pressed={tab === name} className={`shrink-0 border-b-2 px-3 py-3 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 ${tab === name ? "border-emerald-600 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
                  {name} ({tabCounts[name]})
                </button>
              ))}
            </nav>
            <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_180px_170px]">
              <input aria-label="Search projects" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects, clients, or locations" className={`${controlClass} min-w-0`} />
              <select aria-label="Filter projects" value={filter} onChange={(event) => setFilter(event.target.value)} className={controlClass}>
                <option value="all">All clients</option>
                {clients.map((client) => <option key={client} value={`client:${client}`}>{client}</option>)}
                <option value="new">Unread expenses</option>
                <option value="over-contract">Expenses over contract</option>
              </select>
              <select aria-label="Sort projects" value={sort} onChange={(event) => setSort(event.target.value)} className={controlClass}>
                <option value="latest">Sort: Latest</option><option value="name">Sort: Project Name</option><option value="contract">Sort: Contract Amount</option>
              </select>
            </div>
          </div>
          <CeoGmeaProjectsTable projects={visible} />
        </section>
      </div>
    </div>
  );
}
