import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
import { SkeletonTable } from "@/components/PageSkeletonParts";

export default function GmeaOverviewDetailsSkeleton() {
  return <main role="status" aria-busy="true" aria-label="Loading GMEA details" className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8">
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div className="flex flex-wrap justify-between gap-4 border-b border-slate-200 pb-5">
        <div><Block className="mb-5 h-5 w-64" /><Block className="h-8 w-72" /><Block className="mt-1 h-5 w-80" /></div>
        <Block className="h-9 w-40 sm:mt-9" />
      </div>
      <div className="space-y-2 py-1"><Block className="h-10 w-64" /><Block className="h-5 w-full max-w-4xl" /><Block className="h-5 w-2/3" /></div>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3 px-[18px] py-4"><div className="min-w-0 flex-1 space-y-1.5"><Block className="h-4 w-24" /><Block className="h-9 min-w-40 w-full" /></div><div className="space-y-1.5"><Block className="h-4 w-16" /><Block className="h-9 w-40" /></div><Block className="h-9 w-28" /></div>
        <SkeletonTable columns={7} rows={10} minWidth={1060} />
        <div className="flex flex-wrap justify-between gap-3 px-[18px] py-3"><Block className="h-5 w-32" /><Block className="h-8 w-64" /></div>
      </div>
    </div>
  </main>;
}
