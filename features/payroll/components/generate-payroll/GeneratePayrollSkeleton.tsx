import { SkeletonBlock, SkeletonPanel } from "@/components/LoadingSkeleton";
import PayrollWorkflowNavigation from "./PayrollWorkflowNavigation";

export default function GeneratePayrollSkeleton() {
  return (
    <div role="status" aria-label="Loading payroll draft" aria-busy="true">
      <PayrollWorkflowNavigation current={3} canReview={false} />
      <div aria-hidden="true" className="space-y-5 bg-[#fbfcfc] px-4 py-6 sm:px-6 xl:px-7">
        <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div className="space-y-3"><SkeletonBlock className="h-3 w-44" /><SkeletonBlock className="h-10 w-72" /><SkeletonBlock className="h-4 w-80 max-w-full" /></div>
          <div className="flex flex-wrap gap-3"><SkeletonBlock className="h-12 w-64" /><SkeletonBlock className="h-12 w-36" /><SkeletonBlock className="h-12 w-48" /></div>
        </div>
        <SkeletonBlock className="h-7 w-36 rounded-full" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <SkeletonPanel key={index}><SkeletonBlock className="h-3 w-28" /><SkeletonBlock className="mt-3 h-7 w-36" /><SkeletonBlock className="mt-2 h-3 w-44" /></SkeletonPanel>)}
        </div>
        <SkeletonPanel>
          <div className="flex gap-4 border-b border-slate-100 pb-4"><SkeletonBlock className="h-5 w-32" /><SkeletonBlock className="h-5 w-32" /><SkeletonBlock className="h-5 w-24" /><SkeletonBlock className="h-5 w-32" /></div>
          <div className="my-4 flex flex-wrap gap-3"><SkeletonBlock className="h-11 w-72" /><SkeletonBlock className="h-11 w-44" /><SkeletonBlock className="h-11 w-44" />{[0,1,2,3].map(i => <SkeletonBlock key={i} className="h-11 w-28" />)}</div>
          <div className="overflow-hidden rounded-xl border border-slate-200"><div className="h-10 bg-slate-50" />{Array.from({ length: 6 }, (_, index) => <div key={index} className="grid grid-cols-8 items-center gap-4 border-t border-slate-100 py-4">{Array.from({length:8},(_,column)=><SkeletonBlock key={column} className={column===0 ? "h-8 w-full" : "h-4 w-full"} />)}</div>)}</div>
          <div className="mt-4 flex justify-between"><SkeletonBlock className="h-4 w-48" /><SkeletonBlock className="h-9 w-64" /></div>
        </SkeletonPanel>
      </div>
    </div>
  );
}
