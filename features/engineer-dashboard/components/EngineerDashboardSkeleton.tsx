import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonHeading, SkeletonStats, SkeletonPortfolioCards, SkeletonListPanel, SkeletonToolbar } from "@/components/PageSkeletonParts";
export default function EngineerDashboardSkeleton() {
  return <main role="status" aria-busy="true" aria-label="Loading engineer dashboard" className="min-h-full bg-[#f7f9fc] p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-[1500px] space-y-6">
    <CeoPageHeroSkeleton action="none" />
    <SkeletonStats helper cardClassName="rounded-2xl p-4" count={4} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" />
    <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-4"><SkeletonHeading /><SkeletonToolbar count={2} /></div><SkeletonPortfolioCards count={3} image className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" /></section>
    <div className="grid gap-5 lg:grid-cols-2"><SkeletonListPanel /><SkeletonListPanel rows={3} /></div>
  </div></main>;
}
