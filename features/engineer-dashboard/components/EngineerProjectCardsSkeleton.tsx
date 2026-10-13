import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";

export default function EngineerProjectCardsSkeleton() {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {[0, 1, 2, 3, 4].map(index => <SkeletonPanel key={index} className="overflow-hidden p-0">
      <div className="p-4">
        <div className="flex items-start gap-3"><div className="min-w-0 flex-1"><Block className="h-4 w-40 max-w-full" /><Block className="mt-2 h-3 w-32 max-w-full" /></div><Block className="h-6 w-16" /></div>
        <div className="mt-3 border-t border-slate-100 pt-3"><div className="flex justify-between"><Block className="h-4 w-20" /><Block className="h-5 w-10" /></div><Block className="mt-2 h-1.5 w-full" /></div>
        <div className="mt-3 border-t border-slate-100 pt-3"><Block className="h-4 w-16" /><Block className="mt-0.5 h-5 w-48" /></div>
      </div>
      <div className="flex justify-between gap-3 border-t border-slate-100 px-4 py-3"><Block className="h-8 w-24" /><Block className="h-9 w-32" /></div>
    </SkeletonPanel>)}
  </div>;
}
