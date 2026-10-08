import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonBlock, SkeletonPanel } from "@/components/LoadingSkeleton";
import WorkspaceListSkeleton from "@/components/workspace/WorkspaceListSkeleton";

export default function OvertimeRequestPageSkeleton() {
  return <div role="status" aria-busy="true" aria-label="Loading overtime requests" className="p-4 sm:p-6 xl:flex xl:flex-col">
    <CeoPageHeroSkeleton action="none" titleWidth="w-64" descriptionLines={0} />
    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(320px,0.7fr)_minmax(0,1.3fr)] xl:items-stretch">
      <SkeletonPanel className="h-fit p-5">
        <SkeletonBlock className="h-6 w-52" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[0,1,2,3,4].map(index => <div key={index}><SkeletonBlock className="h-5 w-24" /><SkeletonBlock className="mt-1 h-10 w-full" /></div>)}
          <div className="md:col-span-2"><SkeletonBlock className="h-5 w-24" /><SkeletonBlock className="mt-1 h-[90px] w-full" /></div>
        </div>
        <SkeletonBlock className="ml-auto mt-3 h-10 w-40" />
      </SkeletonPanel>
      <div className="min-w-0"><div className="px-4 py-4"><SkeletonBlock className="h-6 w-52" /></div><WorkspaceListSkeleton columns={5} tabs={4} tabLabels={["All requests", "Pending", "Approved", "Rejected"]} filterCount={0} minWidth={640} rowHeight={80} firstColumnLines={3} /></div>
    </div>
  </div>;
}
