import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ProjectThumbnail from "@/features/projects/components/ProjectThumbnail";
import styles from "@/components/workspace/workspace.module.css";
import type { EngineerDashboardProject } from "../types";
import { formatDashboardCurrency, formatDashboardDate } from "../utils/engineerDashboard";

export default function EngineerDashboardProjectCard({ project }: { project: EngineerDashboardProject }) {
  const planning = project.status === "planning";
  const href = planning ? `/cost-estimator?projectId=${project.id}` : `/projects/${project.id}`;
  const status = planning ? "Estimate pending" : project.status === "active" ? "Active" : project.status === "on_hold" ? "On hold" : "Completed";
  const tone = planning ? "bg-amber-50 text-amber-700" : project.status === "on_hold" ? "bg-rose-50 text-rose-700" : "bg-teal-50 text-teal-700";
  return <article className={`${styles.panel} flex flex-col`}>
    <div className="flex items-start gap-3 p-4">
      <ProjectThumbnail src={project.imageUrl} name={project.name} className="h-11 w-12 shrink-0 rounded object-cover" />
      <div className="min-w-0 flex-1"><h3 className="break-words text-sm font-semibold text-slate-900">{project.name}</h3><p className="mt-1 text-xs text-slate-500">{project.location || "Location not set"}</p></div>
      <span className={`shrink-0 rounded px-2 py-1 text-[11px] font-medium ${tone}`}>{status}</span>
    </div>
    <div className="flex-1 space-y-4 px-4 pb-4">
      {planning ? <p className="rounded bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">Prepare the BOQ to activate this project.</p> : <div><div className="flex justify-between text-xs"><span className="text-slate-500">Project progress</span><span className="font-medium text-slate-800">{project.progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eaf5f3]"><div className="h-full rounded-full bg-[#076d69]" style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }} /></div></div>}
      <dl className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
        <div><dt className="text-slate-500">Actual spend</dt><dd className="mt-1 break-words font-medium text-slate-900">{formatDashboardCurrency(project.spent)}</dd></div>
        <div><dt className="text-slate-500">Budget ceiling</dt><dd className="mt-1 break-words font-medium text-slate-900">{formatDashboardCurrency(project.budget)}</dd></div>
      </dl>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3"><p className="text-xs text-slate-500">Target: {formatDashboardDate(project.endDate)}</p><Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-[#076d69] hover:underline">{planning ? "Review estimate" : "View details"}<ArrowUpRight size={14} aria-hidden="true" /></Link></div>
  </article>;
}
