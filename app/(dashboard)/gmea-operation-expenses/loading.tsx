import { SkeletonBlock, SkeletonPanel } from "@/components/LoadingSkeleton";
import { SkeletonStats, SkeletonTable } from "@/components/PageSkeletonParts";

export default function OperationExpensesLoading() {
  return <main role="status" aria-label="Loading operation expenses" aria-busy="true" className="space-y-5 p-5 sm:p-6">
    <SkeletonBlock className="h-9 w-64" /><SkeletonPanel className="space-y-4 p-5">
      <SkeletonBlock className="h-10 w-56" /><SkeletonStats count={5} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" />
      <SkeletonTable columns={8} minWidth={800} />
    </SkeletonPanel>
  </main>;
}
