import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";
import { SkeletonStats, SkeletonPortfolioCards } from "@/components/PageSkeletonParts";
export default function PayrollWorkspaceSkeleton() {
  return <main role="status" aria-busy="true" aria-label="Loading payroll workspace" className="min-h-screen bg-gray-100 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
    <SkeletonPanel className="px-5 py-5 sm:px-6 sm:py-6"><div className="flex flex-wrap items-center justify-between gap-5"><div><Block className="h-3 w-32" /><Block className="mt-2 h-9 w-72" /><Block className="mt-3 h-4 w-full max-w-xl" /></div><Block className="h-11 w-48" /></div></SkeletonPanel>
    <SkeletonStats count={2} className="mt-4 grid gap-3 md:grid-cols-2" />
    <section className="mt-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><Block className="h-6 w-44" /><Block className="mt-2 h-4 w-56" /></div><Block className="h-10 w-64" /></div><div className="mt-4"><SkeletonPortfolioCards count={3} className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3" /></div></section>
  </main>;
}
