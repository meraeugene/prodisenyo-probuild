import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
import ProjectOverviewSkeleton from "./ProjectOverviewSkeleton";
import { CEO_PROJECT_WORKSPACE_TABS } from "../utils/workspaceTabs";
export default function ProjectWorkspaceSkeleton() {
  return <div role="status" aria-label="Loading project details" className="min-h-full space-y-5 bg-slate-50/40 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
    <div className="-mx-4 -mt-5 border-b border-slate-200 bg-slate-50/95 px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mt-7 lg:px-8"><Block className="h-5 w-36" /></div>
    <header className="rounded-3xl bg-[#075e5b] p-6 sm:p-8"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><Block light className="mb-3 h-4 w-44" /><Block light className="h-9 w-80 sm:h-10" /><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">{[0,1,2].map(i => <Block key={i} light className="h-5 w-44" />)}</div></div><div className="rounded-2xl bg-white/10 px-5 py-4"><Block light className="h-4 w-24" /><Block light className="mt-2 h-8 w-40" /></div></div></header>
    <div className="flex w-fit max-w-full gap-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1.5">{CEO_PROJECT_WORKSPACE_TABS.map(tab => <Block key={tab} className="h-10 w-28 shrink-0 rounded-xl" />)}</div>
    <ProjectOverviewSkeleton />
  </div>;
}
