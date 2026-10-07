"use client";

import { Plus } from "lucide-react";
import CeoListToolbar from "@/features/ceo-workspace/components/CeoListToolbar";
import CeoListPagination from "@/features/ceo-workspace/components/CeoListPagination";
import CeoPageHeader from "@/features/ceo-workspace/components/CeoPageHeader";
import styles from "@/features/ceo-workspace/components/ceoWorkspace.module.css";
import { useCeoProjectPortfolio } from "../hooks/useCeoProjectPortfolio";
import type { CeoProjectSort } from "../utils/ceoProjectPortfolio";
import type { ProjectRecord } from "../types";
import CeoProjectsAnalytics from "./CeoProjectsAnalytics";
import CeoProjectsSummary from "./CeoProjectsSummary";
import CeoProjectsTable from "./CeoProjectsTable";

export default function CeoProjectsOverview({ projects, onCreateProject, onOpenProject }: {
  projects: ProjectRecord[]; onCreateProject: () => void; onOpenProject: (projectId: string) => void;
}) {
  const portfolio = useCeoProjectPortfolio(projects);
  return <section className="space-y-5">
    <CeoPageHeader eyebrow="Prodisenyo / Projects" title="Projects" description="Track project budgets, delivery progress, and assigned teams."
      actions={<button type="button" onClick={onCreateProject} className={styles.primaryButton}><Plus size={15} aria-hidden="true" />New project</button>} />
    <CeoProjectsSummary projects={projects} />
    <CeoProjectsAnalytics projects={projects} />
    <section aria-label="Project list" className={styles.panel}>
      <CeoListToolbar tabs={portfolio.tabs} tab={portfolio.status} onTabChange={portfolio.setStatus} query={portfolio.query} onQueryChange={portfolio.setQuery}
        searchLabel="Search projects" placeholder="Project, location, or engineer" hasFilters={portfolio.hasFilters} onReset={portfolio.reset}>
        <label className={styles.field}>Location
          <select aria-label="Filter by location" value={portfolio.location} onChange={(event) => portfolio.setLocation(event.target.value)} className={styles.control}>
            <option value="all">All locations</option>{portfolio.locations.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className={styles.field}>Sort by
          <select aria-label="Sort projects" value={portfolio.sort} onChange={(event) => portfolio.changeSort(event.target.value as CeoProjectSort)} className={styles.control}>
            <option value="latest">Start date</option><option value="name">Project name</option><option value="budget">Budget</option><option value="spent">Actual spend</option><option value="progress">Progress</option><option value="endDate">Target date</option>
          </select>
        </label>
      </CeoListToolbar>
      <CeoProjectsTable projects={portfolio.pagination.pageRows} onOpenProject={onOpenProject} sort={portfolio.sort} direction={portfolio.direction} onSort={portfolio.toggleSort} />
      <CeoListPagination {...portfolio.pagination} total={portfolio.rows.length} noun="projects" label="Project table" />
    </section>
  </section>;
}
