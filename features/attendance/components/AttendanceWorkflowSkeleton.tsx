import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";
import { SkeletonToolbar, SkeletonTable } from "@/components/PageSkeletonParts";
import PayrollWorkflowNavigation from "@/features/payroll/components/generate-payroll/PayrollWorkflowNavigation";
export default function AttendanceWorkflowSkeleton({ step }: { step: 1 | 2 }) {
 return <div role="status" aria-busy="true" aria-label={step === 1 ? "Loading attendance upload" : "Loading attendance review"} className="p-0">
  <PayrollWorkflowNavigation current={step} canReview={false} />
  <div className="px-4 py-6 sm:px-6 xl:px-7">
  <SkeletonPanel className="rounded-none p-5 sm:rounded-[14px]">{step === 1 ? <div className="grid min-h-[330px] place-items-center rounded-2xl border-2 border-dashed border-slate-200 p-6"><div className="flex flex-col items-center"><Block className="h-16 w-16" /><Block className="mt-5 h-6 w-64" /><Block className="mt-3 h-4 w-80" /><Block className="mt-6 h-11 w-48" /></div></div> : <div className="space-y-4"><SkeletonToolbar count={4} /><SkeletonTable columns={8} rows={8} /><div className="flex justify-end"><Block className="h-10 w-52" /></div></div>}</SkeletonPanel>
  </div>
 </div>;
}
