"use client";

import { useMemo, useState } from "react";
import type { ProjectRecord, ProjectStatus } from "@/features/projects/types";
import CeoProjectsAnalytics from "./CeoProjectsAnalytics";
import CeoProjectsSummary from "./CeoProjectsSummary";
import CeoProjectsTable from "./CeoProjectsTable";
import ProjectsPortfolioHero from "./ProjectsPortfolioHero";

type Filter = "all" | ProjectStatus;

export default function CeoProjectsOverview({ projects, onCreateProject, onOpenProject }: {
  projects: ProjectRecord[];
  onCreateProject: () => void;
  onOpenProject: (projectId: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("all");
  const [sort, setSort] = useState("latest");
  const locations = useMemo(
    () => [...new Set(projects.map((project) => project.location).filter(Boolean))].sort(),
    [projects],
  );
  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects
      .filter((project) => {
        const matchesFilter = filter === "all" || project.status === filter;
        const matchesLocation = location === "all" || project.location === location;
        const matchesSearch =
          !term ||
          project.name.toLowerCase().includes(term) ||
          project.location.toLowerCase().includes(term) ||
          project.engineer.toLowerCase().includes(term);
        return matchesFilter && matchesLocation && matchesSearch;
      })
      .sort((left, right) =>
        sort === "name"
          ? left.name.localeCompare(right.name)
          : sort === "budget"
            ? right.budget - left.budget
            : Date.parse(right.startDate) - Date.parse(left.startDate),
      );
  }, [filter, location, projects, search, sort]);
  const filters: Array<{ value: Filter; label: string }> = [
    { value: "all", label: "All Projects" },
    { value: "active", label: "Active" },
    { value: "planning", label: "Pending Estimates" },
    { value: "completed", label: "Completed" },
    { value: "on_hold", label: "On Hold" },
  ];
  const controlClass = "h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px] text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <section className="space-y-4">
      <ProjectsPortfolioHero eyebrow="Executive project portfolio" description="Projects, budgets, delivery progress, and assigned teams in one clear view." onCreate={onCreateProject} />
      <CeoProjectsSummary projects={projects} />
      <CeoProjectsAnalytics projects={projects} />
      <section aria-label="Project list" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
          <nav aria-label="Filter by project status" className="flex max-w-full gap-1 overflow-x-auto">
            {filters.map((item) => {
              const count = item.value === "all" ? projects.length : projects.filter((project) => project.status === item.value).length;
              return <button key={item.value} type="button" onClick={() => setFilter(item.value)} aria-pressed={filter === item.value} className={`shrink-0 border-b-2 px-3 py-3 text-xs font-semibold ${filter === item.value ? "border-emerald-600 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{item.label} ({count})</button>;
            })}
          </nav>
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_160px_160px]">
            <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search projects" placeholder="Search projects, location, or engineer" className={`${controlClass} min-w-0`} />
            <select aria-label="Sort projects" value={sort} onChange={(event) => setSort(event.target.value)} className={controlClass}><option value="latest">Sort: Latest Update</option><option value="name">Sort: Project Name</option><option value="budget">Sort: Highest Budget</option></select>
            <select aria-label="Filter by location" value={location} onChange={(event) => setLocation(event.target.value)} className={controlClass}><option value="all">All Locations</option>{locations.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          </div>
        </div>
        <CeoProjectsTable projects={filteredProjects} onOpenProject={onOpenProject} />
      </section>
    </section>
  );
}
