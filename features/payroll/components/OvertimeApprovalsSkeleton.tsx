import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";
export default function OvertimeApprovalsSkeleton() {
  return <div role="status" aria-label="Loading overtime approvals" className="min-h-full space-y-7 bg-[#f6f8f8] p-4 sm:p-6 lg:p-8">
    <header className="rounded-3xl bg-[#075e5b] p-6 sm:p-8"><Block light className="h-4 w-24" /><Block light className="mt-3 h-9 w-80 sm:h-10" /><Block light className="mt-3 h-5 w-72" /></header>
    <div className="grid items-start gap-6 xl:grid-cols-2">{[0,1].map(column => <div key={column} className="min-w-0"><SkeletonPanel className="flex items-center justify-between gap-4 sm:p-6"><Block className="h-7 w-44" /><Block className="h-7 w-28 rounded-full" /></SkeletonPanel><div className="mt-4 space-y-4">{[0,1].map(i => <SkeletonPanel key={i} className="p-6"><div className="flex flex-wrap gap-3"><Block className="h-5 w-40" /><Block className="h-6 w-24" /></div><Block className="mt-3 h-5 w-52" /><Block className="mt-3 h-12 w-full" /><Block className="mt-3 h-4 w-36" />{column === 0 && <Block className="mt-6 h-28 w-full rounded-xl" />}<div className="flex justify-end gap-2 pt-6"><Block className="h-10 w-24" /><Block className="h-10 w-40" /></div></SkeletonPanel>)}</div></div>)}</div>
  </div>;
}
