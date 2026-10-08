import { SkeletonBlock } from "@/components/LoadingSkeleton";

export default function WorkspaceFiltersSkeleton({ tabs = 3, tabLabels, filters = true, filterCount = 1 }: {
  tabs?: number; tabLabels?: readonly string[]; filters?: boolean; filterCount?: number;
}) {
  return <>
    {tabs > 0 && <div className="flex flex-wrap gap-2 px-[18px] py-[14px]">{Array.from({ length: tabs }, (_, index) => <div key={index} className="relative inline-flex min-h-9 items-center gap-2 px-3 py-2 text-[13px]">
      <span className="invisible">{tabLabels?.[index] ?? "All records"}</span><span className="invisible text-[11px]">0</span><SkeletonBlock className="absolute inset-0 h-full w-full !rounded-[5px]" />
    </div>)}</div>}
    {filters && <div className="flex flex-wrap items-end gap-3 px-[18px] py-4">
      <div className="min-w-0 flex-1 basis-[260px] space-y-1.5"><SkeletonBlock className="h-3 w-24" /><SkeletonBlock className="h-9 w-full" /></div>
      {Array.from({ length: filterCount }, (_, index) => <div key={index} className="min-w-0 flex-1 basis-40 space-y-1.5 sm:flex-none"><SkeletonBlock className="h-3 w-16" /><SkeletonBlock className="h-9 w-full sm:w-40" /></div>)}
      <SkeletonBlock className="ml-auto h-9 w-28" />
    </div>}
  </>;
}
