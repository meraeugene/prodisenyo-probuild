"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Search, SlidersHorizontal } from "lucide-react";
import { getGmeaProjectsDataAction } from "@/actions/gmeaProjects";
import type { GmeaProject } from "../types";
import { buildCeoPortfolio, getCollectionStatus } from "../utils/ceoPortfolio";
import { filterPortfolioProjects, selectPortfolioClients } from "../utils/gmeaPortfolioFilters";
import CeoGmeaSummary from "./CeoGmeaSummary";
import CeoGmeaCharts from "./CeoGmeaCharts";
import CeoGmeaProjectCard from "./CeoGmeaProjectCard";
import GmeaPortfolioHero from "./GmeaPortfolioHero";

const tabs = ["All Projects", "Uncollected", "Partially collected", "Fully collected"] as const;
const controlClass = "h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export default function CeoGmeaProjectsPageClient({ projects }: { projects: GmeaProject[] }) {
  const { data: liveProjects = projects } = useSWR("gmea-projects:list", getGmeaProjectsDataAction, {
    fallbackData: projects, revalidateOnFocus: false, refreshInterval: 30000,
  });
  const [months, setMonths] = useState(6);
  const [tab, setTab] = useState<string>("All Projects");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("latest");
  const [showFilters, setShowFilters] = useState(false);
  const data = useMemo(() => buildCeoPortfolio(liveProjects, months), [liveProjects, months]);
  const clients = useMemo(() => selectPortfolioClients(liveProjects), [liveProjects]);
  const visible = useMemo(() => filterPortfolioProjects(liveProjects, query, filter)
    .filter((project) => tab === "All Projects" || getCollectionStatus(project) === tab)
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "contract" ? b.contract_amount - a.contract_amount : Date.parse(b.created_at) - Date.parse(a.created_at)),
  [liveProjects, query, filter, tab, sort]);
  const filtered = query.trim() || filter !== "all" || tab !== "All Projects";

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <GmeaPortfolioHero canEdit={false} />
        <CeoGmeaSummary count={liveProjects.length} contract={data.contract} expenses={data.expenses} outstanding={data.outstanding} />
        <CeoGmeaCharts data={data} count={liveProjects.length} months={months} onMonthsChange={setMonths} />
        <section aria-label="Projects" className="pt-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav aria-label="Filter by collection status" className="flex max-w-full gap-1 overflow-x-auto">
              {tabs.map((name) => <button key={name} onClick={() => setTab(name)} aria-pressed={tab === name} className={`shrink-0 border-b-2 px-3 py-3 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-700 ${tab === name ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-teal-700"}`}>{name}</button>)}
            </nav>
            <div className="flex w-full flex-wrap gap-2 lg:w-auto">
              <label className="relative min-w-40 flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={15} /><input aria-label="Search projects" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search project, client, or location..." className={controlClass + " w-full pl-9 lg:w-64"} /></label>
              <button aria-expanded={showFilters} aria-controls="ceo-gmea-filters" onClick={() => setShowFilters(!showFilters)} className={controlClass + " inline-flex items-center gap-2"}><SlidersHorizontal size={14} />Filter{filter !== "all" ? " (1)" : ""}</button>
              <select aria-label="Sort projects" value={sort} onChange={(event) => setSort(event.target.value)} className={controlClass}><option value="latest">Latest</option><option value="name">Name A–Z</option><option value="contract">Highest contract</option></select>
            </div>
          </div>
          {showFilters && <div id="ceo-gmea-filters" className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <label className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">Show projects
              <select value={filter} onChange={(event) => setFilter(event.target.value)} className={controlClass + " max-w-full"}>
                <option value="all">All projects</option><option value="new">Unread expenses</option><option value="over-contract">Expenses over contract</option><option value="with-expenses">With expenses</option><option value="without-expenses">No expenses yet</option><option value="missing-client">Client not set</option>
                <optgroup label="Client">{clients.map((client) => <option key={client} value={`client:${client}`}>{client}</option>)}</optgroup>
              </select>
            </label>
          </div>}
          <div className="my-3 flex items-center gap-3 text-[11px] text-slate-500" aria-live="polite">{visible.length} of {liveProjects.length} projects
            {filtered && <button className="rounded text-teal-700 underline focus-visible:ring-2 focus-visible:ring-teal-700" onClick={() => { setTab("All Projects"); setQuery(""); setFilter("all"); }}>Clear filters</button>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((project) => <CeoGmeaProjectCard key={project.id} project={project} />)}
            {!visible.length && <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center md:col-span-2"><h2 className="text-sm font-semibold text-slate-800">No projects found</h2><p className="mt-2 text-xs text-slate-500">{liveProjects.length ? "Try changing your search or filters." : "GMEA projects will appear here once added."}</p></div>}
          </div>
        </section>
      </div>
    </div>
  );
}
