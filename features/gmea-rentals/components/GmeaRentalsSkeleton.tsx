import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import GmeaRentalExpensesSkeleton from "./GmeaRentalExpensesSkeleton";
import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";
import { SkeletonStats, SkeletonTable, SkeletonListPanel, SkeletonHeading } from "@/components/PageSkeletonParts";
type View = "rentals" | "dashboard" | "reports" | "workspace";

function AnalyticsNavigationSkeleton() {
  return <div className="flex flex-wrap gap-2">{["w-20", "w-28", "w-24"].map(width => <Block key={width} className={`h-9 ${width}`} />)}</div>;
}

function RentalSummarySkeleton({ count }: { count: number }) {
  return <div data-skeleton-stats={count} className={count === 7 ? "grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4" : "grid gap-3.5 sm:grid-cols-3"}>
    {Array.from({ length: count }, (_, index) => <SkeletonPanel key={index} className="px-5 py-4"><Block className="h-4 w-32" /><Block className="mt-2 h-[33px] w-32" /></SkeletonPanel>)}
  </div>;
}

export default function GmeaRentalsSkeleton({ view = "rentals", canEdit = true }: { view?: View; canEdit?: boolean }) {
  const analytics = view === "dashboard" || view === "reports";
  const workspace = view === "workspace";
  return <main role="status" aria-busy="true" aria-label={"Loading rental " + view} className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8">
    <div className={`mx-auto max-w-[1440px] ${workspace ? "space-y-5" : "space-y-4"}`}>
      {workspace ? <><Block className="h-5 w-32" /><header className="workspace-page-header pb-2"><div className="flex flex-col justify-between gap-5 sm:flex-row"><div className="min-w-0"><Block className="h-4 w-44" /><Block className="mt-2.5 h-[26px] w-52" /><div className="mt-4 flex flex-wrap gap-4"><Block className="h-5 w-32" /><Block className="h-5 w-40" /><Block className="h-5 w-52" /></div></div><Block className="h-6 w-24" /></div></header></>
        : <CeoPageHeroSkeleton variant={!canEdit && !analytics ? "workspace" : "dashboard"} action="none" titleWidth="w-56" actions={analytics ? <AnalyticsNavigationSkeleton /> : canEdit ? <><Block className="h-9 w-36" /><Block className="h-9 w-28" /></> : undefined} />}
      {view === "reports" && <SkeletonPanel className="p-5"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><SkeletonHeading /><div><Block className="mb-1 h-4 w-12" /><Block className="h-10 w-40" /></div></div></SkeletonPanel>}
      {analytics ? <RentalSummarySkeleton count={view === "dashboard" ? 7 : 3} /> : workspace ? <SkeletonStats count={3} helper compact className="grid gap-4 sm:grid-cols-3" /> : null}
      {view === "rentals" && <GmeaRentalExpensesSkeleton canEdit={canEdit} />}
      {view === "dashboard" && <section className="grid gap-4 xl:grid-cols-2">{[0, 1, 2, 3].map(index => <SkeletonListPanel key={index} />)}</section>}
      {view === "reports" && <><section className="grid gap-4 lg:grid-cols-2"><SkeletonListPanel /><SkeletonListPanel /></section><SkeletonPanel className="p-0"><div className="p-5"><SkeletonHeading /></div><SkeletonTable columns={4} minWidth={640} /></SkeletonPanel></>}
      {workspace && <><div className="flex flex-wrap gap-2">{["w-28", "w-28", "w-24", "w-40"].map((width, index) => <Block key={index} className={`h-9 ${width}`} />)}</div><SkeletonPanel className="p-5 sm:p-7"><div className="flex flex-wrap justify-between gap-2"><SkeletonHeading /><Block className="h-7 w-36" /></div><div className="mt-5"><SkeletonTable columns={5} minWidth={720} /></div></SkeletonPanel></>}
    </div>
  </main>;
}
