import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
export default function PayrollReportsArchiveSkeleton() {
  return <section aria-label="Loading payroll reports" className="mt-4 rounded-none border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(7,109,105,0.07)] sm:rounded-[16px]">
    <Block className="mb-4 h-7 w-28 rounded-full" />
    <div className="overflow-hidden rounded-xl border border-apple-mist"><div className="min-w-[980px]"><div className="grid grid-cols-[19fr_26fr_18fr_16fr_11fr_10fr] gap-3 bg-slate-50 px-3 py-2">{[0,1,2,3,4,5].map(i => <Block key={i} className="h-4 w-24" />)}</div>{[0,1,2,3].map(i => <div key={i} className="grid grid-cols-[19fr_26fr_18fr_16fr_11fr_10fr] items-center gap-3 border-t border-slate-100 px-3 py-4">{[0,1,2,3,4,5].map(j => <div key={j}><Block className={j === 5 ? "h-9 w-9" : "h-4 w-28"} />{j < 2 && <Block className="mt-2 h-3 w-20" />}</div>)}</div>)}</div></div>
  </section>;
}
