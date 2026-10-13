import { SkeletonBlock, SkeletonPanel } from "@/components/LoadingSkeleton";
import { SkeletonStats, SkeletonTable } from "@/components/PageSkeletonParts";

export default function GmeaDashboardLoading() {
  return <main role="status" aria-busy="true" aria-label="Loading GMEA dashboard" className="space-y-5 p-5 sm:p-6"><SkeletonBlock className="h-9 w-52" />
    <SkeletonStats count={4} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" /><SkeletonPanel className="p-5"><SkeletonTable columns={4} minWidth={700} /></SkeletonPanel>
    <SkeletonPanel className="h-80"><SkeletonBlock className="h-full w-full" /></SkeletonPanel>
  </main>;
}
