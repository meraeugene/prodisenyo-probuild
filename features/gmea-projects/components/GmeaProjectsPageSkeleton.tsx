import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonStats } from "@/components/PageSkeletonParts";
import GmeaProjectSummarySkeleton from "./GmeaProjectSummarySkeleton";
export default function GmeaProjectsPageSkeleton() {
  return <div role="status" aria-busy="true" aria-label="Loading GMEA projects" className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8">
    <div className="mx-auto max-w-[1440px] space-y-4"><CeoPageHeroSkeleton action="button" />
      <SkeletonStats helper count={8} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" />
      <GmeaProjectSummarySkeleton />
    </div>
  </div>;
}
