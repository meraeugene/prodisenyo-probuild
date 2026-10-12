import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonStats } from "@/components/PageSkeletonParts";
import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
import GmeaProjectSummarySkeleton from "./GmeaProjectSummarySkeleton";

export default function CeoGmeaProjectsSkeleton() {
  return <div role="status" aria-busy="true" aria-label="Loading GMEA operation expenses" className="min-h-screen p-4 sm:p-6">
    <div className="mx-auto max-w-[1600px] space-y-5">
      <CeoPageHeroSkeleton variant="workspace" action="none" titleWidth="w-72" />
      <div className="flex gap-2"><Block className="h-9 w-24" /><Block className="h-9 w-24" /></div>
      <SkeletonStats helper count={8} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" />
      <GmeaProjectSummarySkeleton ceo />
    </div>
  </div>;
}
