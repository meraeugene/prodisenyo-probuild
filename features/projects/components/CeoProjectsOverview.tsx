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
    <section className="space-y-7">
      <header className="flex flex-col justify-between gap-6 rounded-3xl bg-[#075e5b] p-6 text-white sm:flex-row sm:items-center sm:p-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Prodisenyo Projects</h1>
          <p className="mt-3 text-sm text-teal-50/80">Projects, budgets, and delivery.</p>
        </div>
        <button
          type="button"
          onClick={onCreateProject}
          className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-white px-5 text-sm font-semibold text-[#076d69] transition hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-white"
        >
          <Plus size={17} /> New project
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
                  ? "bg-[#076d69] text-white"
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
            aria-label="Search projects" placeholder="Search projects"
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
            <article key={String(label)} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_24px_-20px_rgba(15,23,42,.25)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">{String(label)}</p>
                <span className={"grid h-9 w-9 place-items-center rounded-xl " + (label === "Pending estimates" ? "bg-amber-50 text-amber-700" : label === "Total projects" ? "bg-sky-50 text-sky-700" : "bg-teal-50 text-teal-700")}><MetricIcon size={18} aria-hidden="true" /></span>
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{String(value)}</p>
              <p className="mt-1 text-sm text-slate-500">{String(helper)}</p>
            </article>
          );
        })}
      </div>

      <div>
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filteredProjects.map((project) => {
            const status = getProjectStatusPresentation(project);
            return (
              <article
                key={project.id}
                className="relative isolate flex min-w-0 flex-col gap-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_-25px_rgba(15,23,42,.25)] transition-shadow hover:shadow-[0_16px_40px_-24px_rgba(15,23,42,.35)]"
              >
                <div className="flex min-w-0 flex-col gap-4">
                  <ProjectThumbnail
                    src={project.imageUrl}
                    name={project.name}
                    className="h-40 w-full rounded-xl object-cover"
                  />
                  <div className="min-w-0 w-full">
                    <h2 className="break-words text-xl font-semibold tracking-tight text-slate-950">{project.name}</h2>
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
                  {project.status === "planning" ? <p className="mt-1 text-sm font-bold text-amber-700">Estimate pending</p> : <><p className="mt-1 text-sm font-bold text-slate-950">{project.progress}%</p><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-700" style={{ width: `${project.progress}%` }} /></div></>}
                </div>
                <div>
                  <p className="text-xs text-slate-500">Budget</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{formatProjectCurrency(project.spent)} <span className="font-normal text-slate-500">/ {formatProjectCurrency(project.budget)}</span></p>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-semibold ${STATUS_CLASSES[status.tone]}`}>{status.label}</span>
                  <button type="button" onClick={() => onOpenProject(project.id)} aria-label={`Open project: ${project.name}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#076d69] after:absolute after:inset-0 after:z-10 after:cursor-pointer after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-teal-700">
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
