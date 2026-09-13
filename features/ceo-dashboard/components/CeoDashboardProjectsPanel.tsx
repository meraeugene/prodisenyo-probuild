import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProjectThumbnail from "@/features/projects/components/ProjectThumbnail";
import type { CeoDashboardProject } from "@/features/ceo-dashboard/types";
import { formatCeoCurrency, formatCeoDate } from "@/features/ceo-dashboard/utils/ceoDashboard";

const STATUS_STYLES: Record<string, string> = {
  active: "text-emerald-700",
  completed: "text-blue-700",
  planning: "text-amber-700",
  on_hold: "text-rose-700",
};

const STATUS_LABELS: Record<string, string> = {
  active: "On Track",
  completed: "Completed",
  planning: "Planning",
  on_hold: "At Risk",
};

export default function CeoDashboardProjectsPanel({ projects }: { projects: CeoDashboardProject[] }) {
  const onTrack = projects.filter((project) => project.status === "active" || project.status === "completed").length;
  const atRisk = projects.filter((project) => project.status === "on_hold").length;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-bold tracking-tight text-slate-950">Project Portfolio</h2>
        <div className="flex items-center gap-5 text-xs font-medium text-slate-500">
          <Link href="/projects" className="border-b-2 border-emerald-600 pb-2 font-semibold text-slate-900">All Projects ({projects.length})</Link>
          <span>On Track ({onTrack})</span>
          <span>At Risk ({atRisk})</span>
        </div>
      </div>
      <div className="hidden grid-cols-[minmax(190px,1.35fr)_minmax(105px,.75fr)_minmax(125px,.8fr)_minmax(110px,.75fr)_minmax(90px,.6fr)_minmax(100px,.7fr)_28px] gap-3 border-b border-slate-100 bg-slate-50/40 px-5 py-2 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 lg:grid">
        <span>Project</span><span>Progress</span><span>Budget Used</span><span>Schedule</span><span>Status</span><span>PM</span><span />
      </div>
      <div className="divide-y divide-slate-100">
        {projects.slice(0, 5).map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`} className="grid gap-3 px-5 py-3 transition hover:bg-slate-50/70 lg:grid-cols-[minmax(190px,1.35fr)_minmax(105px,.75fr)_minmax(125px,.8fr)_minmax(110px,.75fr)_minmax(90px,.6fr)_minmax(100px,.7fr)_28px] lg:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <ProjectThumbnail src={project.imageUrl} name={project.name} className="h-10 w-12 shrink-0 rounded-md object-cover" />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900">{project.name}</p>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">{project.location}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">{project.progress}%</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${project.progress}%` }} /></div>
            </div>
            <div><p className="text-xs font-semibold text-slate-900">{formatCeoCurrency(project.spent)}</p><p className="mt-0.5 text-[10px] text-slate-400">of {formatCeoCurrency(project.budget)}</p></div>
            <p className="text-[11px] text-slate-500">{formatCeoDate(project.endDate)}</p>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${STATUS_STYLES[project.status] || STATUS_STYLES.planning}`}><i className="h-1.5 w-1.5 rounded-full bg-current" />{STATUS_LABELS[project.status] || project.status}</span>
            <p className="truncate text-[11px] text-slate-600">{project.engineer}</p>
            <ArrowRight size={14} className="text-slate-400" />
          </Link>
        ))}
        {!projects.length ? <p className="px-5 py-12 text-center text-sm text-slate-500">No project records are available.</p> : null}
      </div>
    </section>
  );
}
