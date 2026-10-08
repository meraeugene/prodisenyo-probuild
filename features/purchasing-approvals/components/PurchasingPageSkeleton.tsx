import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import WorkspaceListSkeleton from "@/components/workspace/WorkspaceListSkeleton";
import { SkeletonBlock } from "@/components/LoadingSkeleton";

export default function PurchasingPageSkeleton() {
  return <div role="status" aria-busy="true" aria-label="Loading purchasing" className="min-h-full space-y-4 p-4 sm:p-6">
    <CeoPageHeroSkeleton actions={<SkeletonBlock className="h-11 w-full sm:w-52" />} titleWidth="w-40" />
    <WorkspaceListSkeleton columns={9} tabs={7} tabLabels={["All purchases", "Draft", "Submitted", "Approved", "Ordered", "Received", "Cancelled"]} firstColumnLines={2} rowHeight={64} minWidth={1000} />
  </div>;
}
