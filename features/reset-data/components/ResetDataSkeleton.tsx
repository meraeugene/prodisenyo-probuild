import DashboardPageHero from "@/components/DashboardPageHero";
import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
export default function ResetDataSkeleton() {
  return <div role="status" aria-label="Loading workspace settings" className="space-y-4 p-0 sm:p-6"><DashboardPageHero eyebrow="CEO Admin" title="Reset Workspace Data" description="Permanently clears operational records while preserving user accounts. This action cannot be undone." /><section className="rounded-none border border-red-200 bg-white p-5 sm:rounded-[18px]"><div className="rounded-[14px] border border-red-200 bg-red-50 p-4"><Block className="h-6 w-32" /><Block className="mt-2 h-10 w-full" /><Block className="mt-2 h-5 w-72" /></div><Block className="mt-5 h-5 w-44" /><Block className="mt-2 h-11 w-full" /><Block className="ml-auto mt-4 h-11 w-36" /></section></div>;
}
