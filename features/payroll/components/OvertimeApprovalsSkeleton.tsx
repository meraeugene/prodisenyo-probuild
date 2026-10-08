import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";
import WorkspaceFiltersSkeleton from "@/components/workspace/WorkspaceFiltersSkeleton";
import PayrollApprovalQueueSkeleton from "./PayrollApprovalQueueSkeleton";

export default function OvertimeApprovalsSkeleton() {
  return <div aria-busy="true" role="status" aria-label="Loading overtime approvals" className="min-h-full p-4 sm:p-6 lg:p-8">
    <div className="mx-auto max-w-[1560px] space-y-4">
      <CeoPageHeroSkeleton action="status" titleWidth="w-64" />
      <div className="grid items-start gap-5 pt-1 xl:grid-cols-2">{[0, 1].map(column => <div key={column} className="min-w-0">
        <div><div className="p-5"><div className="flex items-center justify-between gap-4"><Block className="h-7 w-44" /><Block className="h-7 w-28 rounded-full" /></div><Block className="mt-1 h-4 w-full max-w-sm" /></div><WorkspaceFiltersSkeleton tabs={4} tabLabels={["All", "Pending", "Approved", "Returned"]} filterCount={0} /></div>
        {column === 0 ? <PayrollApprovalQueueSkeleton /> : <div className="mt-4 space-y-4">{[0, 1].map(index => <SkeletonPanel key={index} className="p-5">
          <div className="flex flex-wrap justify-between gap-3"><div><Block className="h-5 w-36" /><Block className="mt-1 h-4 w-20" /></div><Block className="h-6 w-24" /></div>
          <Block className="mt-3 h-4 w-52" /><Block className="mt-2 h-4 w-40" /><Block className="mt-3 h-10 w-full" /><Block className="mt-3 h-4 w-44" />
          <div className="mt-4 flex justify-end gap-2 pt-3"><Block className="h-9 w-20" /><Block className="h-9 w-36" /></div>
        </SkeletonPanel>)}</div>}
        <div className="mt-4 flex flex-wrap justify-between gap-3 px-[18px] py-3"><Block className="h-4 w-36" /><Block className="h-8 w-60" /></div>
      </div>)}</div>
    </div>
  </div>;
}
