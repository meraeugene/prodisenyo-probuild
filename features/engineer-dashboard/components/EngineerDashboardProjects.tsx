"use client";

import Link from "next/link";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import WorkspaceSearchInput from "@/components/workspace/WorkspaceSearchInput";
import WorkspaceListPagination from "@/components/workspace/WorkspaceListPagination";
import styles from "@/components/workspace/workspace.module.css";
import type { EngineerDashboardProject } from "../types";
import { useEngineerDashboardProjects } from "../hooks/useEngineerDashboardProjects";
import EngineerDashboardProjectCard from "./EngineerDashboardProjectCard";

export default function EngineerDashboardProjects({ projects, selectedProjectId, onSelectedProjectIdChange }: {
  projects: EngineerDashboardProject[]; selectedProjectId: string; onSelectedProjectIdChange: (id: string) => void;
}) {
  const state = useEngineerDashboardProjects(projects, selectedProjectId);
  const hasFilters = state.query !== "" || state.sort !== "recent" || selectedProjectId !== "all";
  return <section aria-label="Dashboard projects" className={styles.panel}>
    <div className={styles.sectionHeader}><div><h2 className={styles.sectionTitle}>Assigned projects</h2><p className={styles.sectionDescription}>Progress, budgets, and upcoming completion dates.</p></div><Link href="/projects" className="inline-flex items-center gap-1 text-xs font-medium text-[#076d69] hover:underline">All projects<ArrowUpRight size={14} aria-hidden="true" /></Link></div>
    <div className={styles.filters}>
      <label className={`${styles.field} ${styles.searchField}`}><span>Search projects</span><WorkspaceSearchInput value={state.query} onChange={event => state.setQuery(event.target.value)} placeholder="Project name or location" /></label>
      <label className={styles.field}>Project
        <select aria-label="Filter by project" value={selectedProjectId} onChange={event => onSelectedProjectIdChange(event.target.value)} className={`${styles.control} sm:max-w-60`}><option value="all">All projects</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
      </label>
      <label className={styles.field}>Sort by<select aria-label="Sort projects" value={state.sort} onChange={event => state.setSort(event.target.value)} className={styles.control}><option value="recent">Recent start date</option><option value="name">Project name</option><option value="progress">Highest progress</option></select></label>
      <button type="button" disabled={!hasFilters} onClick={() => { state.setQuery(""); state.setSort("recent"); onSelectedProjectIdChange("all"); }} className={`${styles.button} ${styles.reset}`}><RotateCcw size={14} aria-hidden="true" />Reset filters</button>
    </div>
    {state.rows.length ? <div className="grid gap-4 border-t border-slate-100 p-4 md:grid-cols-2 xl:grid-cols-3">{state.pagination.pageRows.map(project => <EngineerDashboardProjectCard key={project.id} project={project} />)}</div> : <div className={styles.empty}><p className="font-medium text-slate-800">{hasFilters ? "No matching projects" : "No assigned projects yet"}</p><p className="mt-2">{hasFilters ? "Try a different search or reset your filters." : "Projects assigned to you will appear here."}</p></div>}
    <WorkspaceListPagination {...state.pagination} total={state.rows.length} noun="projects" label="Dashboard projects" />
  </section>;
}
