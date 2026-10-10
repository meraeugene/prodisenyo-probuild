import { SkeletonBlock } from "@/components/LoadingSkeleton";
import WorkspaceFiltersSkeleton from "@/components/workspace/WorkspaceFiltersSkeleton";
import layout from "./gmeaProjectTable.module.css";

export default function GmeaProjectSummarySkeleton({ ceo = false }: { ceo?: boolean }) {
  return <div aria-hidden="true" className="min-w-0">
    <WorkspaceFiltersSkeleton tabs={ceo ? 6 : 3} filterCount={ceo ? 2 : 1} tabLabels={ceo ? undefined : ["Ongoing", "Completed", "All projects"]} />
    <div className={layout.desktop}><table className="w-full table-fixed border-collapse text-left">
      <colgroup>{[18, 15, 12, 12, 12, 12, 10, 9].map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
      <thead><tr>{Array.from({ length: 8 }, (_, index) => <th key={index} className="px-2 py-4"><SkeletonBlock className="h-4 w-3/4" /></th>)}</tr></thead>
      <tbody>{Array.from({ length: 9 }, (_, row) => <tr key={row} className="border-t border-slate-200/60">
        {Array.from({ length: 8 }, (_, col) => <td key={col} className="px-2 py-5"><SkeletonBlock className="h-4 w-4/5" />{col < 2 && <><SkeletonBlock className="mt-2 h-3 w-full" /><SkeletonBlock className="mt-2 h-3 w-3/4" /></>}</td>)}
      </tr>)}</tbody>
      <tfoot><tr>{Array.from({ length: 8 }, (_, col) => <td key={col} className="px-2 py-4"><SkeletonBlock className="h-4 w-4/5" /></td>)}</tr></tfoot>
    </table></div>
    <div className={layout.cards}>{Array.from({ length: 9 }, (_, index) => <div key={index} className="border-b border-slate-200 p-5">
      <div className="flex justify-between gap-3"><SkeletonBlock className="h-4 w-2/5" /><SkeletonBlock className="h-6 w-20" /></div>
      <SkeletonBlock className="mt-2 h-4 w-3/4" /><SkeletonBlock className="mt-2 h-3 w-1/2" />
      <div className="my-4 grid grid-cols-2 gap-3">{Array.from({ length: 4 }, (_, cell) => <div key={cell}><SkeletonBlock className="h-3 w-20" /><SkeletonBlock className="mt-2 h-4 w-28" /></div>)}</div>
      <SkeletonBlock className="h-9 w-20" />
    </div>)}</div>
    <div className="px-5 py-4"><SkeletonBlock className="h-4 w-64" /></div>
    <div className="flex flex-wrap justify-between gap-3 px-5 py-3"><SkeletonBlock className="h-4 w-40" /><SkeletonBlock className="h-8 w-60" /></div>
  </div>;
}
