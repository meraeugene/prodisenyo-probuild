import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";

export default function ProjectsPageSkeleton() {
  return <div role="status" aria-label="Loading projects" className="space-y-4 p-0 sm:p-6"><section className="space-y-7">
    <header className="flex flex-col justify-between gap-6 rounded-3xl bg-[#075e5b] p-6 sm:flex-row sm:items-center sm:p-8"><div><Block light className="h-9 w-80 sm:h-10" /><Block light className="mt-3 h-5 w-60" /></div><Block light className="h-11 w-40" /></header>
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-2 overflow-hidden pb-1">{["w-28","w-20","w-44","w-24","w-28"].map((width, i) => <Block key={i} className={`h-10 shrink-0 ${width}`} />)}</div><Block className="h-10 w-full lg:w-72" /></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0,1,2,3].map(i => <SkeletonPanel key={i} className="p-6"><div className="flex justify-between gap-3"><Block className="h-4 w-28" /><Block className="h-9 w-9" /></div><Block className="mt-4 h-9 w-16" /><Block className="mt-1 h-5 w-28" /></SkeletonPanel>)}</div>
    <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">{[0,1,2].map(i => <SkeletonPanel key={i} className="flex flex-col gap-5 p-6"><div><Block className="h-40 w-full rounded-xl" /><Block className="mt-4 h-7 w-44" /><Block className="mt-1 h-4 w-32" /></div>{[0,1,2].map(j => <div key={j}><Block className="h-4 w-24" /><Block className="mt-2 h-5 w-40" /></div>)}<div className="flex justify-between gap-3 border-t border-slate-100 pt-4"><Block className="h-7 w-28" /><Block className="h-5 w-28" /></div></SkeletonPanel>)}</div>
    <Block className="h-4 w-40" />
  </section></div>;
}
