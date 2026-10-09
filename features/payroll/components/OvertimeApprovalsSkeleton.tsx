import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
import WorkspaceListSkeleton from "@/components/workspace/WorkspaceListSkeleton";

export default function OvertimeApprovalsSkeleton() {
  return <div aria-busy="true" role="status" aria-label="Loading overtime approvals" className="min-h-full p-4 sm:p-6 lg:p-8">
    <div className="mx-auto max-w-[1560px] space-y-4">
      <CeoPageHeroSkeleton action="none" actions={<Block className="h-9 w-44" />} titleWidth="w-64" />
      <div className="flex flex-wrap gap-2"><Block className="h-9 w-48" /><Block className="h-9 w-36" /></div>
      <div className="min-w-0">
        <div className="p-5"><div className="flex items-center justify-between gap-4"><Block className="h-7 w-44" /><Block className="h-7 w-28 rounded-full" /></div><Block className="mt-1 h-4 w-full max-w-sm" /></div>
        <WorkspaceListSkeleton columns={8} tabs={4} tabLabels={["All", "Pending", "Approved", "Returned"]} filterCount={0} minWidth={1120} rowHeight={76} />
      </div>
    </div>
  </div>;
}
