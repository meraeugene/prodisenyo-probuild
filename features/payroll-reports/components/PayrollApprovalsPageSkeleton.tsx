import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
import PayrollReportsArchiveSkeleton from "./PayrollReportsArchiveSkeleton";
import { SkeletonStats } from "@/components/PageSkeletonParts";

export default function PayrollApprovalsPageSkeleton() {
  return (
    <div aria-busy="true"
      role="status"
      aria-label="Loading payroll approvals"
      className="min-h-full p-4 sm:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-[1560px] space-y-4">
      <CeoPageHeroSkeleton action="status" titleWidth="w-60" />
      <div className="flex gap-2"><Block className="h-9 w-28" /><Block className="h-9 w-24" /></div>
      <SkeletonStats helper count={4} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" />

      <PayrollReportsArchiveSkeleton />
      </div>
    </div>
  );
}
