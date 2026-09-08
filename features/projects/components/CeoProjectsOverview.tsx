"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleCheckBig,
  FolderKanban,
  MapPin,
  PauseCircle,
  Plus,
  Search,
} from "lucide-react";
import type { ProjectRecord, ProjectStatus } from "@/features/projects/types";
import ProjectThumbnail from "@/features/projects/components/ProjectThumbnail";
import {
  formatProjectCurrency,
  getProjectStatusPresentation,
} from "@/features/projects/utils/projectPresentation";

type Filter = "all" | ProjectStatus;

const STATUS_CLASSES = {
  emerald: "border-teal-200 bg-teal-50 text-teal-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  slate: "border-slate-200 bg-slate-100 text-slate-700",
};

export default function CeoProjectsOverview({
  projects,
  onCreateProject,
  onOpenProject,
}: {
  projects: ProjectRecord[];
  onCreateProject: () => void;
  onOpenProject: (projectId: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesFilter = filter === "all" || project.status === filter;
      const matchesSearch =
        !term ||
        project.name.toLowerCase().includes(term) ||
        project.location.toLowerCase().includes(term) ||
        project.engineer.toLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
  }, [filter, projects, search]);

  const active = projects.filter((project) => project.status === "active").length;
  const planning = projects.filter((project) => project.status === "planning").length;
  const completed = projects.filter((project) => project.status === "completed").length;
  const onHold = projects.filter((project) => project.status === "on_hold").length;
  const filters: Array<{ value: Filter; label: string }> = [
    { value: "all", label: "All Projects" },
    { value: "active", label: "Active" },
    { value: "planning", label: "Pending Cost Estimate" },
    { value: "on_hold", label: "On Hold" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950">PRODISENYO Projects</h1>
          <p className="mt-1 text-sm text-slate-500">Overview of all construction projects.</p>
        </div>
        <button
          type="button"
          onClick={onCreateProject}
          className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-teal-800 px-5 text-sm font-semibold text-white transition hover:bg-teal-900"
        >
          <Plus size={17} /> Create New Project
        </button>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`h-10 shrink-0 rounded-xl px-4 text-sm font-semibold transition ${
                filter === item.value
                  ? "bg-teal-800 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="relative block w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total projects", projects.length, "All records", FolderKanban],
          ["Active projects", active, "In progress", BriefcaseBusiness],
          ["Pending estimates", planning, "Not operational yet", PauseCircle],
          ["Completed", completed, `${onHold} currently on hold`, CircleCheckBig],
        ].map(([label, value, helper, Icon]) => {
          const MetricIcon = Icon as typeof FolderKanban;
          return (
            <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">{String(label)}</p>
                <MetricIcon size={16} className="text-teal-700" />
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{String(value)}</p>
              <p className="mt-1 text-sm text-slate-500">{String(helper)}</p>
            </article>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="divide-y divide-slate-100">
          {filteredProjects.map((project) => {
            const status = getProjectStatusPresentation(project);
            return (
              <article
                key={project.id}
                className="grid gap-4 p-4 md:grid-cols-[minmax(260px,1.4fr)_minmax(180px,.8fr)_minmax(150px,.65fr)_minmax(190px,.75fr)_auto] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <ProjectThumbnail
                    src={project.imageUrl}
                    name={project.name}
                    className="h-20 w-32 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-slate-950">{project.name}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin size={13} /> <span className="truncate">{project.location}</span>
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{project.status === "planning" ? "Estimate Engineer" : "Project Engineer"}</p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className="truncate">{project.status === "planning" ? project.estimateEngineer : project.engineer}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{project.status === "planning" ? "Workflow" : "Progress"}</p>
                  {project.status === "planning" ? <p className="mt-1 text-sm font-bold text-amber-700">Cost estimate first</p> : <><p className="mt-1 text-sm font-bold text-slate-950">{project.progress}%</p><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-700" style={{ width: `${project.progress}%` }} /></div></>}
                </div>
                <div>
                  <p className="text-xs text-slate-500">Budget</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{formatProjectCurrency(project.spent)} <span className="font-normal text-slate-500">/ {formatProjectCurrency(project.budget)}</span></p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span className={`inline-flex h-10 w-40 items-center justify-center whitespace-nowrap rounded-xl border px-3 text-xs font-bold ${STATUS_CLASSES[status.tone]}`}>{status.label}</span>
                  <button type="button" onClick={() => onOpenProject(project.id)} className="inline-flex h-10 w-40 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    {project.status === "planning" ? "Review Estimate" : "View Details"} <ArrowRight size={13} />
                  </button>
                </div>
              </article>
            );
          })}
          {!filteredProjects.length ? (
            <div className="px-6 py-16 text-center">
              <p className="font-semibold text-slate-800">No matching projects</p>
              <p className="mt-1 text-sm text-slate-500">Try another filter or search term.</p>
            </div>
          ) : null}
        </div>
      </div>
      <p className="text-xs text-slate-500">Showing {filteredProjects.length} of {projects.length} projects</p>
    </section>
  );
}
