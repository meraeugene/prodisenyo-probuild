import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
export default function PayrollReportsArchiveSkeleton() {
  return <section aria-label="Loading payroll reports" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="flex flex-wrap gap-5"><Block className="h-5 w-32" /><Block className="h-5 w-28" /><Block className="h-5 w-24" /></div><div className="flex flex-1 flex-wrap justify-end gap-2"><Block className="h-9 min-w-48 flex-1 sm:max-w-72" /><Block className="h-9 w-32" /><Block className="h-9 w-32" /></div></div>
    <div className="border-t border-slate-200"><div className="grid grid-cols-[1.05fr_1.25fr_1.15fr_.6fr_.6fr_1fr_.9fr_1fr_.8fr_.55fr] gap-3 bg-slate-50 px-4 py-3">{Array.from({ length: 10 }, (_, i) => <Block key={i} className="h-3 w-full" />)}</div>{Array.from({ length: 4 }, (_, i) => <div key={i} className="grid grid-cols-[1.05fr_1.25fr_1.15fr_.6fr_.6fr_1fr_.9fr_1fr_.8fr_.55fr] items-center gap-3 border-t border-slate-100 px-4 py-4">{Array.from({ length: 10 }, (_, j) => <Block key={j} className="h-4 w-full" />)}</div>)}</div>
  </section>;
}
