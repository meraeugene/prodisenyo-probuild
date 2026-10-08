import { SkeletonBlock } from "@/components/LoadingSkeleton";
import { SkeletonStats } from "@/components/PageSkeletonParts";
import PayrollWorkflowNavigation from "./PayrollWorkflowNavigation";
import GeneratePayrollRecordsSkeleton from "./GeneratePayrollRecordsSkeleton";

export default function GeneratePayrollSkeleton() {
  return (
    <div role="status" aria-label="Loading payroll draft" aria-busy="true">
      <PayrollWorkflowNavigation current={3} canReview={false} />
      <section aria-hidden="true" className="min-h-screen px-4 pb-6 pt-5 sm:px-6 sm:pt-6 xl:px-7">
        <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div className="min-w-0 max-w-2xl"><SkeletonBlock className="h-4 w-44" /><SkeletonBlock className="mt-1.5 h-[33px] w-64" /><div className="mt-1.5 flex h-6 items-center"><SkeletonBlock className="h-3.5 w-full max-w-xl" /></div></div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 sm:min-w-[315px]"><SkeletonBlock className="mb-1.5 h-4 w-24" /><SkeletonBlock className="h-9 w-full" /></div>
            <div className="flex flex-col gap-2 sm:flex-row"><SkeletonBlock className="h-9 w-36" /><SkeletonBlock className="h-9 w-52" /></div>
          </div>
        </div>
        <SkeletonBlock className="mt-4 h-[30px] w-44 rounded-full" />
        <SkeletonStats helper count={4} className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" />
        <div className="mt-4"><GeneratePayrollRecordsSkeleton /></div>
      </section>
    </div>
  );
}
