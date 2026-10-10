import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonBlock, SkeletonPanel } from "@/components/LoadingSkeleton";
import WorkspaceListSkeleton from "@/components/workspace/WorkspaceListSkeleton";

export default function UserManagementSkeleton() {
  return <div aria-busy="true" role="status" aria-label="Loading user management" className="space-y-4 overflow-x-hidden p-4 sm:p-6">
    <CeoPageHeroSkeleton action="none" titleWidth="w-60" />
    <SkeletonPanel className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div><SkeletonBlock className="h-4 w-20" /><div className="mt-2 flex items-center gap-3"><SkeletonBlock className="h-7 w-16" /><SkeletonBlock className="h-5 w-24" /></div></div>
        <SkeletonBlock className="h-10 w-28" />
      </div>
      <WorkspaceListSkeleton embedded columns={6} tabs={3} tabLabels={["All accounts", "Active", "Inactive"]} filterCount={1} mobileCards firstColumnLines={2} rowHeight={64} minWidth={0} columnWidths={["24%", "16%", "24%", "17%", "11%", "8%"]} />
    </SkeletonPanel>
  </div>;
}
