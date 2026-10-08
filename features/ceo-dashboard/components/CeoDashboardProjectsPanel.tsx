"use client";

import { useState } from "react";
import Link from "next/link";
import type { CeoDashboardProject, CeoPortfolioFilter } from "../types";
import { buildCeoAttentionItems, formatCeoCurrency, formatCeoDate } from "../utils/ceoDashboard";
import { selectCeoPortfolioProjects, CEO_PROJECT_STATUS_LABELS, CEO_PROJECT_STATUS_STYLES } from "../utils/ceoPortfolioSelectors";
import styles from "./ceoDashboard.module.css";
import WorkspaceTabSwitch from "@/components/workspace/WorkspaceTabSwitch";

export default function CeoDashboardProjectsPanel({ projects }: { projects: CeoDashboardProject[] }) {
  const [filter, setFilter] = useState<CeoPortfolioFilter>("all");
  const visibleProjects = selectCeoPortfolioProjects(projects, filter);
  const attentionCount = buildCeoAttentionItems(projects).length;
  const filters = [
    { value: "all" as const, label: "All Projects", count: projects.length },
    { value: "on-track" as const, label: "On Track", count: selectCeoPortfolioProjects(projects, "on-track").length },
    { value: "at-risk" as const, label: "At Risk", count: selectCeoPortfolioProjects(projects, "at-risk").length },
  ];
  return (
    <section className={`${styles.panel} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={styles.heading}>Project Portfolio</h2>
        <WorkspaceTabSwitch label="Filter project portfolio" mode="filter" items={filters} value={filter} onChange={setFilter} />
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-[11px]">
          <thead className="bg-teal-50/40 text-[#53736f]"><tr>
            {["Project", "Progress", "Budget Used", "Schedule", "Status", "PM"].map((label) => <th key={label} scope="col" className="px-2 py-2.5 font-medium first:rounded-l-lg last:rounded-r-lg">{label}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-teal-900/[0.06]">
            {visibleProjects.slice(0, 5).map((project) => <tr key={project.id} className="transition-colors hover:bg-teal-50/30">
              <th scope="row" className="px-2 py-3 text-[#1d1d1f]"><Link href={`/projects/${project.id}`} className="block max-w-[160px] font-medium leading-5 hover:text-[#076d69] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700">{project.name}</Link></th>
              <td className="px-2 py-3"><div className="flex items-center gap-2"><progress max={100} value={project.progress} aria-label={`${project.name} progress`} className={`${styles.progress} h-1.5 w-14 shrink-0`} /><span className="text-[#53736f] tabular-nums">{project.progress}%</span></div></td>
              <td className="whitespace-nowrap px-2 py-3 tabular-nums"><span className="text-[#294b48]">{formatCeoCurrency(project.spent)}</span><span className="block text-[10px] text-[#53736f]">of {formatCeoCurrency(project.budget)}</span></td>
              <td className="whitespace-nowrap px-2 py-3 text-[#53736f]">{formatCeoDate(project.endDate)}</td>
              <td className="whitespace-nowrap px-2 py-3"><span className={`inline-flex items-center gap-1.5 ${CEO_PROJECT_STATUS_STYLES[project.status]}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{CEO_PROJECT_STATUS_LABELS[project.status]}</span></td>
              <td className="px-2 py-3 leading-5 text-[#53736f]">{project.engineer}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {!visibleProjects.length && <p className="py-10 text-center text-sm text-[#53736f]">{projects.length ? "No projects match this filter." : "No project records are available."}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px]">
        {attentionCount > 0 ? <Link href="/projects" className="text-amber-700 hover:underline">{attentionCount} {attentionCount === 1 ? "issue needs" : "issues need"} attention</Link> : <span className="text-[#53736f]">Showing {Math.min(5, visibleProjects.length)} of {visibleProjects.length} projects</span>}
        <Link href="/projects" className="font-medium text-[#076d69] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700">View all projects</Link>
      </div>
    </section>
  );
}
