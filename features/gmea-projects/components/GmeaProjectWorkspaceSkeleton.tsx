import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";
export default function GmeaProjectWorkspaceSkeleton() {
  return <div role="status" aria-label="Loading GMEA project" className="min-h-full space-y-7 bg-white p-4 sm:p-6 lg:p-8">
    <Block className="h-5 w-32" />
    <header className="rounded-3xl bg-[#075e5b] p-6 sm:p-8"><Block light className="h-4 w-64" /><Block light className="mt-3 h-9 w-80 sm:h-10" /><Block light className="mt-4 h-5 w-52" /><Block light className="mt-2 h-5 w-40" /></header>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0,1,2,3].map(i => <SkeletonPanel key={i} className="p-5 sm:p-6"><div className="flex justify-between gap-3"><Block className="h-4 w-28" /><Block className="h-9 w-9" /></div><Block className="mt-4 h-8 w-40" /></SkeletonPanel>)}</div>
    <div className="flex w-fit max-w-full gap-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1.5">{["w-40","w-24","w-48"].map(w => <Block key={w} className={`h-10 shrink-0 ${w}`} />)}</div>
    <SkeletonPanel className="space-y-5 p-5 sm:p-7"><div className="flex flex-wrap justify-between gap-3"><div><Block className="h-7 w-80" /><Block className="mt-1 h-5 w-72" /></div><Block className="h-10 w-44" /></div>
      <div className="grid gap-3 sm:grid-cols-3">{[0,1,2].map(i => <div key={i} className="rounded-xl bg-slate-50 p-5"><Block className="h-4 w-28" /><Block className="mt-2 h-7 w-40" /></div>)}</div>
      <div className="overflow-hidden rounded-xl border border-slate-200"><div className="h-12 bg-slate-50" />{[0,1,2].map(i => <div key={i} className="grid min-w-[900px] grid-cols-6 gap-4 border-t border-slate-100 p-3">{[0,1,2,3,4,5].map(j => <Block key={j} className="h-10 w-full" />)}</div>)}<div className="h-14 border-t border-slate-200 bg-slate-50" /></div>
    </SkeletonPanel>
  </div>;
}
