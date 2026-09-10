"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, ChevronDown, FileText, MapPin, Search, SlidersHorizontal } from "lucide-react";
import ProjectThumbnail from "@/features/projects/components/ProjectThumbnail";
import type { EngineerDashboardProject, EngineerProjectStatus } from "@/features/engineer-dashboard/types";
import { formatDashboardCurrency } from "@/features/engineer-dashboard/utils/engineerDashboard";

type SortMode = "recent" | "name" | "progress";

const STATUS_LABELS: Record<EngineerProjectStatus, string> = {
  planning: "Estimate pending",
  active: "On track",
  on_hold: "On hold",
  completed: "Completed",
};

export default function EngineerDashboardProjects({ projects, selectedProjectId, onSelectedProjectIdChange }: {
  projects: EngineerDashboardProject[];
  selectedProjectId: string;
  onSelectedProjectIdChange: (projectId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects
      .filter((project) => selectedProjectId === "all" || project.id === selectedProjectId)
      .filter((project) => !normalizedQuery || `${project.name} ${project.location}`.toLowerCase().includes(normalizedQuery))
      .sort((left, right) => sort === "name" ? left.name.localeCompare(right.name) : sort === "progress" ? right.progress - left.progress : new Date(right.startDate).getTime() - new Date(left.startDate).getTime());
  }, [projects, query, selectedProjectId, sort]);

  return (
    <section aria-labelledby="engineer-projects-heading">
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <h2 id="engineer-projects-heading" className="text-2xl font-semibold tracking-[-0.035em] text-slate-950">Projects</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">{visibleProjects.length} {visibleProjects.length === 1 ? "project" : "projects"}</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative block sm:w-72">
            <span className="sr-only">Search projects</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects..." className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
          </label>
          <label className="relative block">
            <span className="sr-only">Filter by project</span>
            <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
            <select value={selectedProjectId} onChange={(event) => onSelectedProjectIdChange(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-teal-400 sm:w-32">
              <option value="all">Filter</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          </label>
          <label className="relative block">
            <span className="sr-only">Sort projects</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-9 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-teal-400 sm:w-32">
              <option value="recent">Recent</option><option value="name">Name</option><option value="progress">Progress</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          </label>
        </div>
      </div>

      {visibleProjects.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <p className="font-semibold text-slate-700">No projects match this view</p>
          <p className="mt-1 text-sm text-slate-500">Try a different search or project filter.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {visibleProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}
    </section>
  );
}

function ProjectCard({ project }: { project: EngineerDashboardProject }) {
  const isPlanning = project.status === "planning";
  const href = isPlanning ? `/cost-estimator?projectId=${project.id}` : `/projects/${project.id}`;
  const statusTone = isPlanning ? "bg-amber-50 text-amber-700" : project.status === "on_hold" ? "bg-rose-50 text-rose-700" : "bg-teal-50 text-teal-700";
  const dotTone = isPlanning ? "bg-amber-500" : project.status === "on_hold" ? "bg-rose-500" : "bg-teal-600";

  return (
    <article className="group overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.1)]">
      <div className="relative h-36 overflow-hidden bg-slate-100">
        <ProjectThumbnail src={project.imageUrl} name={project.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" />
        <span className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold shadow-sm ${statusTone}`}><span className={`h-2 w-2 rounded-full ${dotTone}`} />{STATUS_LABELS[project.status]}</span>
      </div>
      <div className="p-4">
        <h3 className="truncate text-lg font-semibold tracking-[-0.025em] text-slate-950">{project.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-500"><MapPin size={15} />{project.location || "Location not set"}</p>
        {isPlanning ? (
          <div className="mt-3 border-t border-slate-100 pt-3"><p className="text-xs text-slate-500">Workflow</p><p className="mt-0.5 text-sm font-semibold text-amber-700">Estimate pending</p></div>
        ) : (
          <div className="mt-3 border-t border-slate-100 pt-3"><div className="flex items-center justify-between"><p className="text-xs text-slate-500">Progress</p><p className="text-sm font-semibold text-slate-950">{project.progress}%</p></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${project.progress}%` }} /></div></div>
        )}
        <div className="mt-3 border-t border-slate-100 pt-3"><p className="text-xs text-slate-500">Budget</p><p className="mt-0.5 text-sm"><span className="font-semibold text-slate-950">{formatDashboardCurrency(project.spent)}</span><span className="text-slate-400"> / {formatDashboardCurrency(project.budget)}</span></p></div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
        <span className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${statusTone}`}>{isPlanning ? <FileText size={16} /> : <BarChart3 size={16} />}{isPlanning ? "Pending Cost Estimate" : STATUS_LABELS[project.status]}</span>
        <Link href={href} className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700">{isPlanning ? "Review Estimate" : "View Details"}<ArrowRight size={17} /></Link>
      </div>
    </article>
  );
}
