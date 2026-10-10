import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonHeading, SkeletonStats, SkeletonListPanel, SkeletonToolbar } from "@/components/PageSkeletonParts";
import EngineerProjectCardsSkeleton from "./EngineerProjectCardsSkeleton";
export default function EngineerDashboardSkeleton() {
  return <main role="status" aria-busy="true" aria-label="Loading engineer dashboard" className="min-h-full p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-[1500px] space-y-6">
    <CeoPageHeroSkeleton action="none" />
    <SkeletonStats helper count={4} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" />
    <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-4"><SkeletonHeading /><SkeletonToolbar count={3} /></div><EngineerProjectCardsSkeleton /></section>
    <div className="grid gap-5 lg:grid-cols-2"><SkeletonListPanel /><SkeletonListPanel rows={3} /></div>
  </div></main>;
}
