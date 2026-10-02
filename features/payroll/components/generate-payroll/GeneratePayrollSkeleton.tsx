import { SkeletonBlock, SkeletonPanel } from "@/components/LoadingSkeleton";
import PayrollWorkflowNavigation from "./PayrollWorkflowNavigation";

export default function GeneratePayrollSkeleton() {
  return (
    <div role="status" aria-label="Loading payroll draft" aria-busy="true">
      <PayrollWorkflowNavigation current={3} canReview={false} />
      <div aria-hidden="true" className="space-y-5 bg-[#fbfcfc] px-4 py-6 sm:px-6 xl:px-7">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-3"><SkeletonBlock className="h-3 w-44" /><SkeletonBlock className="h-10 w-72" /><SkeletonBlock className="h-4 w-80 max-w-full" /></div>
          <div className="flex flex-wrap gap-3"><SkeletonBlock className="h-12 w-64" /><SkeletonBlock className="h-12 w-36" /><SkeletonBlock className="h-12 w-48" /></div>
        </div>
        <SkeletonBlock className="h-7 w-36 rounded-full" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <SkeletonPanel key={index}><SkeletonBlock className="h-3 w-28" /><SkeletonBlock className="mt-3 h-7 w-36" /><SkeletonBlock className="mt-2 h-3 w-44" /></SkeletonPanel>)}
        </div>
        <SkeletonPanel>
          <div className="flex gap-4 border-b border-slate-100 pb-4"><SkeletonBlock className="h-5 w-32" /><SkeletonBlock className="h-5 w-32" /><SkeletonBlock className="h-5 w-24" /></div>
          <div className="my-4 flex flex-wrap gap-3"><SkeletonBlock className="h-11 w-72" /><SkeletonBlock className="h-11 w-44" /><SkeletonBlock className="h-11 w-44" /></div>
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="grid grid-cols-3 items-center gap-6 py-4 sm:grid-cols-5"><SkeletonBlock className="h-8 w-full" /><SkeletonBlock className="h-4 w-full" /><SkeletonBlock className="h-4 w-full" /><SkeletonBlock className="hidden h-4 w-full sm:block" /><SkeletonBlock className="hidden h-8 w-16 sm:block" /></div>)}
          </div>
        </SkeletonPanel>
      </div>
    </div>
  );
}
