import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonStats } from "@/components/PageSkeletonParts";
import { SkeletonPanel, SkeletonBlock as Block } from "@/components/LoadingSkeleton";
import GmeaProjectSummarySkeleton from "./GmeaProjectSummarySkeleton";

export default function CeoGmeaProjectsSkeleton() {
  return <div role="status" aria-busy="true" aria-label="Loading GMEA project portfolio" className="min-h-screen p-4 sm:p-6">
    <div className="mx-auto max-w-[1600px] space-y-5">
      <CeoPageHeroSkeleton variant="workspace" action="none" titleWidth="w-52" />
      <SkeletonStats helper count={8} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" />
      <section className="grid gap-3 xl:grid-cols-[1.35fr_.85fr]">
        <SkeletonPanel className="p-5"><div className="flex flex-wrap justify-between gap-3"><div><Block className="h-7 w-64" /><Block className="mt-3 h-5 w-56" /></div><Block className="h-9 w-36" /></div><Block className="mt-4 h-[300px] w-full" /></SkeletonPanel>
        <SkeletonPanel className="p-5"><Block className="h-7 w-40" /><div className="mt-5 grid items-center gap-5 sm:grid-cols-[170px_minmax(0,1fr)] xl:grid-cols-[160px_minmax(0,1fr)]"><Block className="h-40 w-40 rounded-full" /><div className="space-y-6"><Block className="h-4 w-full" /><Block className="h-4 w-full" /><Block className="h-4 w-full" /></div></div></SkeletonPanel>
      </section>
      <GmeaProjectSummarySkeleton ceo />
    </div>
  </div>;
}
