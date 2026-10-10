"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";

import { getGmeaProjectsDataAction } from "@/actions/gmeaProjects";
import type { GmeaProject } from "../types";
import { buildGmeaPortfolioSummary } from "../utils/gmeaPortfolioSummary";
import { filterPortfolioProjects, selectPortfolioClients } from "../utils/gmeaPortfolioFilters";
import GmeaDialog from "./GmeaDialog";
import GmeaPortfolioHero from "./GmeaPortfolioHero";
import GmeaProjectMetricSummary from "./GmeaProjectMetricSummary";
import GmeaProjectForm from "./GmeaProjectForm";
import GmeaProjectOverview from "./GmeaProjectOverview";
import GmeaPortfolioTable from "./GmeaPortfolioTable";
import WorkspaceListToolbar from "@/components/workspace/WorkspaceListToolbar";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import { useTablePagination } from "@/features/shared/hooks/useTablePagination";
import styles from "@/components/workspace/workspace.module.css";
import { orderProjectSummary } from "../utils/projectSummaryColumns";

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
  const [statusFilter, setStatusFilter] = useState<"active" | "completed" | "all">("all");
  const [create, setCreate] = useState(false);
  const [details, setDetails] = useState<GmeaProject | null>(null);

  const visible = useMemo(() => {
    const byStatus = statusFilter === "all"
      ? liveProjects
      : liveProjects.filter((project) => project.status === statusFilter);
    return orderProjectSummary(filterPortfolioProjects(byStatus, query, filter));
  }, [filter, liveProjects, query, statusFilter]);
  const pagination = useTablePagination(visible, JSON.stringify([query, filter, statusFilter]));
  const clients = useMemo(() => selectPortfolioClients(liveProjects), [liveProjects]);
  const hasFilters = Boolean(query.trim()) || filter !== "all" || statusFilter !== "all";

  const { ongoingCount, completedCount } = useMemo(
    () => buildGmeaPortfolioSummary(liveProjects), [liveProjects],
  );

  return (
    <div className="min-h-full bg-white px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8">
      <div className="mx-auto max-w-[1440px] space-y-4">
        <GmeaPortfolioHero canEdit={canEdit} onCreate={() => setCreate(true)} />
        <GmeaProjectMetricSummary projects={liveProjects} />

        <section aria-label="GMEA project records" className={styles.panel}>
          <WorkspaceListToolbar tabs={[
            { value: "active" as const, label: "Ongoing", count: ongoingCount },
            { value: "completed" as const, label: "Completed", count: completedCount },
            { value: "all" as const, label: "All projects", count: liveProjects.length },
          ]} tab={statusFilter} onTabChange={setStatusFilter} query={query} onQueryChange={setQuery}
            searchLabel="Search projects" placeholder="Search project, client or location" hasFilters={hasFilters}
            onReset={() => { setQuery(""); setFilter("all"); setStatusFilter("all"); }}>
            <label className={styles.field}>Filter projects<select aria-label="Filter projects" className={styles.control} value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All projects</option>
              <optgroup label="Expenses"><option value="with-expenses">With expenses</option><option value="without-expenses">No expenses yet</option><option value="over-contract">Expenses over contract</option>{!canEdit && <option value="new">Unread expenses</option>}</optgroup>
              <optgroup label="Client"><option value="missing-client">Client not set</option>{clients.map((client) => <option key={client} value={`client:${client}`}>{client}</option>)}</optgroup>
            </select></label>
          </WorkspaceListToolbar>
          <GmeaPortfolioTable projects={pagination.pageRows} totalProjects={visible} canEdit={canEdit} onDetails={setDetails} />
          {!visible.length && <p className={styles.empty}>{liveProjects.length ? "No projects match these filters." : "Your GMEA workspace is ready for its first project."}</p>}
          <WorkspaceListPagination {...pagination} total={visible.length} noun="projects" label="GMEA project table" />
        </section>
      </div>

      {create && <GmeaProjectForm onClose={() => setCreate(false)} />}
      {details && (
        <GmeaDialog title={details.title} onClose={() => setDetails(null)}>
          <GmeaProjectOverview project={details} />
        </GmeaDialog>
      )}
    </div>
  );
}
