"use client";

import WorkspacePageHeader from "@/components/workspace/WorkspacePageHeader";
import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import WorkspaceListToolbar from "@/components/workspace/WorkspaceListToolbar";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import styles from "@/components/workspace/workspace.module.css";
import { useEstimatePortfolio } from "../hooks/useEstimatePortfolio";
import type { EstimatePortfolioSort } from "../utils/estimatePortfolio";
import type { AssignedEstimateProject, ProjectEstimateItemRow, ProjectEstimateRow } from "../types";
import CostEstimatorProjectsTable from "./CostEstimatorProjectsTable";

export default function CostEstimatorProjectsOverview({ estimates, assignedProjects, itemsByEstimateId, pending, onOpenProject, onStartEstimate }: {
  estimates: ProjectEstimateRow[]; assignedProjects: AssignedEstimateProject[]; itemsByEstimateId: Record<string, ProjectEstimateItemRow[]>;
  pending: boolean; onOpenProject: (id: string) => void; onStartEstimate: (id: string) => void;
}) {
  const portfolio = useEstimatePortfolio(estimates, assignedProjects, itemsByEstimateId);
  return <div className={`${styles.page} space-y-5`}>
    <WorkspacePageHeader eyebrow="Engineer / Cost estimator" title="Cost Estimator" description="Prepare project Bills of Quantities, check budgets, and track CEO reviews." />
    <WorkspaceSummaryCards ariaLabel="Estimate summary" className="grid-cols-2 xl:grid-cols-5" cards={[
      { label: "Assigned records", value: portfolio.entries.length, hint: "Projects and estimates" },
      { label: "To prepare", value: portfolio.count("not_started") + portfolio.count("draft"), hint: "Not started or in draft" },
      { label: "Submitted", value: portfolio.count("submitted"), hint: "Awaiting CEO review" },
      { label: "Approved", value: portfolio.count("approved"), hint: "Ready for project delivery" },
      { label: "Returned", value: portfolio.count("rejected"), hint: "Requires correction" },
    ]} />
    <section aria-label="Assigned estimate records" className={styles.panel}>
      <WorkspaceListToolbar tabs={portfolio.tabs} tab={portfolio.status} onTabChange={portfolio.setStatus}
        query={portfolio.query} onQueryChange={portfolio.setQuery} searchLabel="Search estimates" placeholder="Project name or location" hasFilters={portfolio.hasFilters} onReset={portfolio.reset}>
        <label className={styles.field}>Sort by<select aria-label="Sort estimates" value={portfolio.sort} onChange={event => portfolio.setSort(event.target.value as EstimatePortfolioSort)} className={styles.control}>
          <option value="recent">Recently updated</option><option value="name">Project name</option><option value="cost">Highest estimated cost</option>
        </select></label>
      </WorkspaceListToolbar>
      <CostEstimatorProjectsTable entries={portfolio.pagination.pageRows} pending={pending} hasFilters={portfolio.hasFilters} onOpen={entry => entry.estimate ? onOpenProject(entry.estimate.id) : onStartEstimate(entry.id)} />
      <WorkspaceListPagination {...portfolio.pagination} total={portfolio.rows.length} noun="records" label="Estimate table" />
    </section>
  </div>;
}
