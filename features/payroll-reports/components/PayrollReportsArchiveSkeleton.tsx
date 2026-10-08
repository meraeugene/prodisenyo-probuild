import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
import WorkspaceTableSkeleton from "@/components/workspace/WorkspaceTableSkeleton";

export default function PayrollReportsArchiveSkeleton() {
  return <section role="status" aria-busy="true" aria-label="Loading payroll reports" className="min-w-0">
    <div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:items-end xl:justify-between">
      <div className="flex max-w-full flex-wrap gap-2">{["w-36", "w-32", "w-24", "w-24"].map((width, index) => <Block key={index} className={`h-9 ${width}`} />)}</div>
      <div className="grid gap-2 sm:grid-cols-[minmax(210px,1fr)_150px_150px_150px]"><Block className="h-9 w-full" />{[0, 1, 2].map(index => <Block key={index} className="h-9 w-full" />)}</div>
    </div>
    <WorkspaceTableSkeleton columns={10} rows={5} minWidth={0} columnWidths={["10%", "15%", "9%", "8%", "6%", "11%", "10%", "11%", "11%", "9%"]} />
  </section>;
}
