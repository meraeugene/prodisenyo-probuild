import { SkeletonBlock } from "@/components/LoadingSkeleton";
import layout from "./gmeaProjectTable.module.css";

export default function GmeaProjectMetricSkeleton() {
  return <main role="status" aria-busy="true" aria-label="Loading project details" className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8"><div className="mx-auto max-w-[1440px] space-y-5">
    <header className="workspace-page-header flex flex-wrap justify-between gap-4 pb-5"><div><SkeletonBlock className="mb-5 h-4 w-48" /><SkeletonBlock className="h-8 w-64" /><SkeletonBlock className="mt-2 h-4 w-64" /></div><SkeletonBlock className="h-9 w-40 sm:mt-9" /></header>
    <div className="space-y-2 py-1"><SkeletonBlock className="h-10 w-64" /><SkeletonBlock className="h-4 w-3/4" /></div>
    <section data-skeleton-panel="true" className="skeleton-surface overflow-hidden"><div className="flex flex-wrap gap-4 px-[18px] py-4"><SkeletonBlock className="h-14 min-w-40 flex-1" /><SkeletonBlock className="mt-auto h-9 w-28" /></div>
    <div className={layout.desktop}><table className="w-full table-fixed"><thead><tr>{Array.from({ length: 6 }, (_, index) => <th key={index} className="p-3"><SkeletonBlock className="h-4 w-3/4" /></th>)}</tr></thead><tbody>{Array.from({ length: 10 }, (_, row) => <tr key={row} className="border-t border-slate-200/60">{Array.from({ length: 6 }, (_, col) => <td key={col} className="p-4"><SkeletonBlock className="h-4 w-4/5" />{col === 0 && <SkeletonBlock className="mt-2 h-3 w-2/3" />}</td>)}</tr>)}</tbody></table></div>
    <div className={layout.cards}>{Array.from({ length: 10 }, (_, index) => <div key={index} className="space-y-3 border-b border-[#edf1f5] p-5"><div className="flex justify-between"><SkeletonBlock className="h-4 w-2/5" /><SkeletonBlock className="h-6 w-20" /></div><SkeletonBlock className="h-3 w-1/3" /><div className="grid grid-cols-2 gap-3">{Array.from({ length: 3 }, (_, cell) => <div key={cell}><SkeletonBlock className="h-3 w-20" /><SkeletonBlock className="mt-1 h-4 w-28" /></div>)}</div></div>)}</div>
    <div className="border-t border-slate-100 px-5 py-4"><SkeletonBlock className="h-4 w-64" /></div><div className="flex flex-wrap justify-between gap-3 px-[18px] py-3"><SkeletonBlock className="h-4 w-40" /><SkeletonBlock className="h-8 w-60" /></div></section>
  </div></main>;
}
