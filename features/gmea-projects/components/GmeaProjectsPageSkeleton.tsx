import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";
export default function GmeaProjectsPageSkeleton() {
  return <div role="status" aria-label="Loading GMEA projects" className="min-h-full space-y-7 bg-white p-4 sm:p-6 lg:p-8">
    <header className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-[#075e5b] p-6 sm:p-8"><div><Block light className="h-4 w-64" /><Block light className="mt-3 h-9 w-72 sm:h-10" /><Block light className="mt-3 h-5 w-72" /></div></header>
    <div className="grid gap-4 sm:grid-cols-3">{[0,1,2].map(i => <SkeletonPanel key={i} className="p-6"><div className="flex justify-between gap-3"><Block className="h-5 w-28" /><Block className="h-9 w-9" /></div><Block className="mt-4 h-8 w-44" /></SkeletonPanel>)}</div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><Block className="h-7 w-28" /><Block className="mt-1 h-4 w-36" /></div><Block className="h-11 w-full sm:max-w-md" /></div>
    <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">{[0,1,2].map(i => <SkeletonPanel key={i} className="overflow-hidden p-6"><Block className="h-11 w-11 rounded-xl" /><Block className="mt-5 h-7 w-48" /><Block className="mt-1 h-5 w-32" /><Block className="mt-3 h-4 w-40" /><div className="my-6 grid gap-4 border-t border-slate-100 pt-5"><div><Block className="h-4 w-28" /><Block className="mt-1 h-8 w-48" /></div><div><Block className="h-4 w-20" /><Block className="mt-1 h-5 w-32" /></div></div><div className="-mx-6 -mb-6 flex justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4"><Block className="h-5 w-28" /><Block className="h-5 w-16" /></div></SkeletonPanel>)}</div>
  </div>;
}
