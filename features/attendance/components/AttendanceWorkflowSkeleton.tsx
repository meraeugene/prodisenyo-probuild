import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";
import { SkeletonTable } from "@/components/PageSkeletonParts";
import PayrollWorkflowNavigation from "@/features/payroll/components/generate-payroll/PayrollWorkflowNavigation";

export default function AttendanceWorkflowSkeleton({ step }: { step: 1 | 2 }) {
  return <div role="status" aria-busy="true" aria-label={step === 1 ? "Loading attendance upload" : "Loading attendance review"}>
    <PayrollWorkflowNavigation current={step} canReview={false} />
    <div className="px-4 py-6 sm:px-6 xl:px-7">
      {step === 1 ? <SkeletonPanel className="p-5"><div className="grid min-h-[330px] place-items-center p-6"><div className="flex flex-col items-center"><Block className="h-16 w-16" /><Block className="mt-5 h-6 w-64" /><Block className="mt-3 h-4 w-80" /><Block className="mt-6 h-11 w-48" /></div></div></SkeletonPanel>
        : <SkeletonPanel>
          <div className="px-4 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6"><div className="mb-1 flex items-center gap-2"><Block className="h-4 w-12" /><Block className="h-5 w-24" /></div><Block className="h-7 w-72 sm:h-8" /><Block className="mt-1 h-5 w-full max-w-xl" /></div>
          <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{[0, 1].map(index => <div key={index} className="px-4 py-3"><Block className="h-4 w-16" /><Block className="mt-1 h-5 w-24" /><Block className="mt-1 h-5 w-20" /></div>)}</div>
            <div className="flex flex-wrap gap-2"><Block className="h-9 w-24" /><Block className="h-9 w-28" /></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[0, 1, 2, 3, 4].map(index => <Block key={index} className="h-11 w-full" />)}</div>
            <SkeletonTable columns={12} rows={10} minWidth={1250} />
            <div className="flex flex-wrap justify-between gap-3"><Block className="h-4 w-44" /><Block className="h-9 w-52" /></div>
            <div className="flex flex-wrap items-center justify-between gap-4 p-4"><div><Block className="h-5 w-44" /><Block className="mt-1 h-5 w-72" /></div><Block className="h-11 w-60" /></div>
          </div>
        </SkeletonPanel>}
    </div>
  </div>;
}
