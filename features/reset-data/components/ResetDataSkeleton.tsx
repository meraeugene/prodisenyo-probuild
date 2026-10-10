import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
export default function ResetDataSkeleton() {
  return <div aria-busy="true" role="status" aria-label="Loading workspace settings" className="space-y-4 p-0 sm:p-6"><CeoPageHeroSkeleton action="none" /><section data-skeleton-panel="true" className="skeleton-surface rounded-none p-5 sm:rounded-[18px]"><div data-skeleton-panel="true" className="skeleton-surface rounded-[14px] p-4"><Block className="h-6 w-32" /><Block className="mt-2 h-10 w-full" /><Block className="mt-2 h-5 w-72" /></div><Block className="mt-5 h-5 w-44" /><Block className="mt-2 h-11 w-full" /><Block className="ml-auto mt-4 h-11 w-36" /></section></div>;
}
