"use client";

import WorkspacePageHeader from "@/components/workspace/WorkspacePageHeader";
import WorkspaceListToolbar from "@/components/workspace/WorkspaceListToolbar";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import styles from "@/components/workspace/workspace.module.css";
import { useEngineerProjectPortfolio, type EngineerProjectSort } from "../hooks/useEngineerProjectPortfolio";
import type { ProjectRecord } from "../types";
import EngineerProjectsTable from "./EngineerProjectsTable";

export default function EngineerProjectPortfolio({ projects, onOpenProject }: {
  projects: ProjectRecord[]; onOpenProject: (id: string) => void;
}) {
  const portfolio = useEngineerProjectPortfolio(projects);
  return <section className="space-y-5" aria-label="Engineer project portfolio">
    <WorkspacePageHeader eyebrow="Engineer / Projects" title="Projects" description="Manage your assigned projects, prepare estimates, and track delivery progress." />
    <WorkspaceSummaryCards ariaLabel="Assigned project summary" className="grid-cols-2 xl:grid-cols-5" cards={[
      { label: "Assigned projects", value: projects.length, hint: "All assigned records" },
      { label: "Pending estimates", value: projects.filter(project => project.status === "planning").length, hint: "Awaiting cost estimate" },
      { label: "Active projects", value: projects.filter(project => project.status === "active").length, hint: "Currently in progress" },
      { label: "Completed", value: projects.filter(project => project.status === "completed").length, hint: "Successfully delivered" },
      { label: "On hold", value: projects.filter(project => project.status === "on_hold").length, hint: "Requires follow-up" },
    ]} />
    <section aria-label="Assigned project records" className={styles.panel}>
      <WorkspaceListToolbar tabs={portfolio.tabs} tab={portfolio.status} onTabChange={portfolio.setStatus}
        query={portfolio.search} onQueryChange={portfolio.setSearch} searchLabel="Search projects" placeholder="Project name or location"
        hasFilters={portfolio.hasFilters} onReset={portfolio.reset}>
        <label className={styles.field}>Sort by
          <select aria-label="Sort projects" value={portfolio.sort} onChange={event => portfolio.setSort(event.target.value as EngineerProjectSort)} className={styles.control}>
            <option value="updated">Latest target date</option><option value="progress_high">Highest progress</option><option value="progress_low">Lowest progress</option><option value="name">Project name</option>
          </select>
        </label>
      </WorkspaceListToolbar>
      <EngineerProjectsTable projects={portfolio.pagination.pageRows} hasFilters={portfolio.hasFilters} onOpenProject={onOpenProject} />
      <WorkspaceListPagination {...portfolio.pagination} total={portfolio.rows.length} noun="projects" label="Assigned project table" />
    </section>
  </section>;
}
