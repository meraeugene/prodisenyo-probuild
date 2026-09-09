"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  MapPin,
  Search,
} from "lucide-react";
import ProjectThumbnail from "./ProjectThumbnail";
import type { ProjectRecord, ProjectStatus } from "../types";
import { getProjectStatusPresentation } from "../utils/projectPresentation";
import ProjectsPortfolioHero from "./ProjectsPortfolioHero";

type SortOption = "updated" | "progress_high" | "progress_low" | "name";

const summaryCards = [
  { key: "total", label: "Assigned records", helper: "All assignments" },
  { key: "planning", label: "Cost estimates", helper: "Awaiting activation" },
  { key: "active", label: "On going", helper: "Operational projects" },
  { key: "completed", label: "Completed", helper: "Successfully completed" },
] as const;

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function StatusBadge({ project }: { project: ProjectRecord }) {
  const status = getProjectStatusPresentation(project);
  const tone =
    project.status === "planning"
      ? "bg-amber-50 text-amber-700"
      : project.status === "on_hold"
        ? "bg-rose-50 text-rose-700"
        : "bg-teal-50 text-teal-700";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>
      {project.status === "active" ? "On Going" : status.label}
    </span>
  );
}

function ProgressCell({ project }: { project: ProjectRecord }) {
  if (project.status === "planning") {
    return (
      <div>
        <p className="text-xs font-semibold text-amber-700">Estimate required</p>
        <p className="mt-1 text-[11px] text-slate-500">Progress unlocks after activation</p>
      </div>
    );
  }
  return (
    <div>
      <span className="text-xs font-semibold text-slate-800">{project.progress}%</span>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-teal-700" style={{ width: `${project.progress}%` }} />
      </div>
    </div>
  );
}

export default function EngineerProjectPortfolio({
  projects,
  onOpenProject,
}: {
  projects: ProjectRecord[];
  onOpenProject: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");
  const [sort, setSort] = useState<SortOption>("updated");
  const counts = useMemo(
    () => ({
      total: projects.length,
      planning: projects.filter((project) => project.status === "planning").length,
      active: projects.filter((project) => project.status === "active").length,
      completed: projects.filter((project) => project.status === "completed").length,
    }),
    [projects],
  );
  const visibleProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects
      .filter(
        (project) =>
          (status === "all" || project.status === status) &&
          (!query ||
            project.name.toLowerCase().includes(query) ||
            project.location.toLowerCase().includes(query)),
      )
      .sort((left, right) => {
        if (sort === "name") return left.name.localeCompare(right.name);
        if (sort === "progress_high") return right.progress - left.progress;
        if (sort === "progress_low") return left.progress - right.progress;
        return new Date(right.endDate).getTime() - new Date(left.endDate).getTime();
      });
  }, [projects, search, sort, status]);

  return (
    <section className="space-y-5" aria-labelledby="engineer-projects-heading">
      <div id="engineer-projects-heading">
        <ProjectsPortfolioHero
          eyebrow="Engineer project portfolio"
          description="Your assigned construction projects, cost estimates, deadlines, and progress."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ key, label, helper }) => (
          <article key={key} className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_-25px_rgba(15,23,42,.25)]">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{counts[key]}</p>
            <p className="mt-1 text-xs text-slate-500">{helper}</p>
          </article>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[minmax(240px,1fr)_180px_220px]">
          <label className="relative"><span className="sr-only">Search projects</span><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects or locations..." className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></label>
          <label><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value as "all" | ProjectStatus)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-teal-500"><option value="all">All statuses</option><option value="planning">Pending Cost Estimate</option><option value="active">On Going</option><option value="on_hold">On Hold</option><option value="completed">Completed</option></select></label>
          <label className="relative"><span className="sr-only">Sort projects</span><ArrowDownUp size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-700 outline-none focus:border-teal-500"><option value="updated">Latest target date</option><option value="progress_high">Highest progress</option><option value="progress_low">Lowest progress</option><option value="name">Project name</option></select></label>
        </div>

        {!visibleProjects.length ? (
          <div className="px-6 py-16 text-center"><p className="font-semibold text-slate-800">No matching projects</p><p className="mt-1 text-sm text-slate-500">Try changing the search or status filter.</p></div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[980px] table-fixed text-left">
                <thead><tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-500"><th className="w-[31%] px-5 py-3">Project</th><th className="w-[19%] px-4 py-3">Progress</th><th className="w-[14%] px-4 py-3">Status</th><th className="w-[13%] px-4 py-3">Start Date</th><th className="w-[13%] px-4 py-3">Target Completion</th><th className="w-[10%] px-4 py-3 text-right">Actions</th></tr></thead>
                <tbody>{visibleProjects.map((project) => <tr key={project.id} className="border-b border-slate-100 last:border-0 hover:bg-teal-50/20"><td className="px-5 py-3"><div className="flex items-center gap-3"><ProjectThumbnail src={project.imageUrl} name={project.name} className="h-16 w-20 shrink-0 rounded-lg object-cover" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{project.name}</p><p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500"><MapPin size={12} />{project.location}</p></div></div></td><td className="px-4 py-3"><ProgressCell project={project} /></td><td className="px-4 py-3"><StatusBadge project={project} /></td><td className="px-4 py-3 text-xs font-medium text-slate-600">{formatDate(project.startDate)}</td><td className="px-4 py-3 text-xs font-medium text-slate-800">{formatDate(project.endDate)}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => onOpenProject(project.id)} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-800 transition hover:border-teal-300 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2">{project.status === "planning" ? "Cost Estimate" : "View Details"}</button></td></tr>)}</tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 lg:hidden">{visibleProjects.map((project) => <article key={project.id} className="p-4"><div className="flex gap-3"><ProjectThumbnail src={project.imageUrl} name={project.name} className="h-16 w-20 shrink-0 rounded-lg object-cover" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 className="truncate text-sm font-semibold text-slate-950">{project.name}</h2><StatusBadge project={project} /></div><p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500"><MapPin size={12} />{project.location}</p><div className="mt-3"><ProgressCell project={project} /></div></div></div><div className="mt-4 flex items-center justify-between gap-3"><p className="text-xs text-slate-500">{formatDate(project.startDate)} – {formatDate(project.endDate)}</p><button type="button" onClick={() => onOpenProject(project.id)} className="h-9 shrink-0 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-800">{project.status === "planning" ? "Cost Estimate" : "View Details"}</button></div></article>)}</div>
          </>
        )}
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">Showing {visibleProjects.length} of {projects.length} assigned records</div>
      </div>
    </section>
  );
}
