import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonStats, SkeletonListPanel, SkeletonTable, SkeletonHeading } from "@/components/PageSkeletonParts";
import { SkeletonPanel, SkeletonBlock } from "@/components/LoadingSkeleton";
export default function PurchaserDashboardSkeleton() {
  return <main role="status" aria-busy="true" aria-label="Loading purchaser dashboard" className="min-h-full space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
    <CeoPageHeroSkeleton actions={<><SkeletonBlock className="h-11 w-56" /><SkeletonBlock className="h-9 w-40" /></>} />
    <SkeletonStats helper cardClassName="min-h-28 rounded-[22px] p-5" count={4} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" />
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,.8fr)]"><SkeletonPanel className="p-0"><div className="px-5 py-4"><SkeletonHeading /></div><SkeletonTable columns={5} /></SkeletonPanel><SkeletonListPanel rows={5} /></div>
    <div className="grid gap-5 xl:grid-cols-3"><SkeletonListPanel rows={3} /><SkeletonListPanel rows={3} /><SkeletonListPanel rows={3} /></div>
  </main>;
}
