"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  LuChevronDown as ChevronDown,
  LuListFilter as ListFilter,
  LuSearch as Search,
} from "react-icons/lu";
import { getGmeaProjectsDataAction } from "@/actions/gmeaProjects";
import type { GmeaProject } from "../types";
import { projectSummary, sumMoney } from "../utils/gmeaCalculations";
import { filterPortfolioProjects, selectPortfolioClients } from "../utils/gmeaPortfolioFilters";
import GmeaDialog from "./GmeaDialog";
import GmeaPortfolioHero from "./GmeaPortfolioHero";
import GmeaPortfolioStats from "./GmeaPortfolioStats";
import GmeaProjectForm from "./GmeaProjectForm";
import GmeaProjectOverview from "./GmeaProjectOverview";
import GmeaProjectPortfolioCard from "./GmeaProjectPortfolioCard";

export default function GmeaProjectsPageClient({
  projects,
  canEdit,
}: {
  projects: GmeaProject[];
  canEdit: boolean;
}) {
  const { data: liveProjects = projects } = useSWR(
    "gmea-projects:list",
    getGmeaProjectsDataAction,
    {
      fallbackData: projects,
      revalidateOnFocus: false,
      refreshInterval: canEdit ? 0 : 30000,
    },
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [create, setCreate] = useState(false);
  const [details, setDetails] = useState<GmeaProject | null>(null);

  const visible = useMemo(
    () => filterPortfolioProjects(liveProjects, query, filter),
    [filter, liveProjects, query],
  );
  const clients = useMemo(() => selectPortfolioClients(liveProjects), [liveProjects]);
  const hasFilters = Boolean(query.trim()) || filter !== "all";

  const summaries = liveProjects.map(projectSummary);
  const contractTotal = sumMoney(summaries.map((summary) => summary.contract));
  const expenseTotal = sumMoney(summaries.map((summary) => summary.expenses));

  return (
    <div className="min-h-full bg-[#f5f7f8] px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8">
      <div className="mx-auto max-w-[1440px] space-y-4">
        <GmeaPortfolioHero canEdit={canEdit} onCreate={() => setCreate(true)} />
        <GmeaPortfolioStats
          projectCount={liveProjects.length}
          contractTotal={contractTotal}
          expenseTotal={expenseTotal}
        />

        <section className="pt-3" aria-labelledby="gmea-project-list-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="gmea-project-list-heading" className="text-[20px] font-bold tracking-[-0.035em] text-slate-950">
                {hasFilters ? "Filtered projects" : "All projects"}
              </h2>
              <p aria-live="polite" className="mt-0.5 text-xs text-slate-500">
                {visible.length} {visible.length === 1 ? "project" : "projects"}
                {hasFilters ? ` of ${liveProjects.length} shown` : " in your portfolio"}
                {hasFilters && (
                  <button type="button" onClick={() => { setQuery(""); setFilter("all"); }} className="ml-3 rounded text-teal-700 underline underline-offset-2 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700">
                    Clear filters
                  </button>
                )}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:max-w-[560px] sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search projects</span>
                <Search aria-hidden="true" size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  aria-label="Search projects"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-[0_8px_24px_-20px_rgba(15,23,42,.32)] outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  placeholder="Search project, client, or location..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <label className="relative shrink-0">
                <span className="sr-only">Filter projects</span>
                <ListFilter className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-700" size={17} />
                <select
                  aria-label="Filter projects"
                  className="h-11 w-full appearance-none truncate rounded-xl border border-slate-200 bg-white py-0 pl-10 pr-9 text-sm font-semibold text-slate-700 shadow-[0_8px_24px_-20px_rgba(15,23,42,.32)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:w-52"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  <option value="all">All projects</option>
                  <optgroup label="Expenses">
                    <option value="with-expenses">With expenses</option>
                    <option value="without-expenses">No expenses yet</option>
                    <option value="over-contract">Expenses over contract</option>
                    {!canEdit && <option value="new">Unread expenses</option>}
                  </optgroup>
                  <optgroup label="Client">
                    <option value="missing-client">Client not set</option>
                    {clients.map((client) => <option key={client} value={`client:${client}`}>{client}</option>)}
                  </optgroup>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              </label>
            </div>
          </div>

          {visible.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {visible.map((project) => (
                <GmeaProjectPortfolioCard
                  key={project.id}
                  project={project}
                  canEdit={canEdit}
                  onDetails={() => setDetails(project)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[16px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <p className="text-sm font-semibold text-slate-900">No projects found</p>
              <p className="mt-1 text-xs text-slate-500">
                {liveProjects.length ? "Try a different search or filter." : "Your GMEA workspace is ready for its first project."}
              </p>
            </div>
          )}
        </section>
      </div>

      {create && <GmeaProjectForm onClose={() => setCreate(false)} />}
      {details && (
        <GmeaDialog title={details.name} onClose={() => setDetails(null)}>
          <GmeaProjectOverview project={details} />
        </GmeaDialog>
      )}
    </div>
  );
}
