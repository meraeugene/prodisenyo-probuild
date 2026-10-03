import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";
import { SkeletonStats, SkeletonToolbar, SkeletonPortfolioCards, SkeletonTable, SkeletonListPanel, SkeletonHeading } from "@/components/PageSkeletonParts";
type View = "rentals" | "dashboard" | "reports" | "workspace";
export default function GmeaRentalsSkeleton({ view = "rentals" }: { view?: View }) {
 const analytics = view === "dashboard" || view === "reports";
 return <main role="status" aria-busy="true" aria-label={"Loading rental " + view} className="min-h-full bg-white px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8"><div className={"mx-auto max-w-[1440px] " + (view === "workspace" ? "space-y-5" : "space-y-4")}>
  {view === "workspace" && <Block className="h-5 w-32" />}
  <CeoPageHeroSkeleton action={view === "workspace" ? "status" : "button"} />
  {!analytics && view !== "workspace" && <SkeletonToolbar count={3} />}
  {view === "reports" && <SkeletonPanel><div className="flex flex-wrap items-end justify-between gap-4"><SkeletonHeading /><SkeletonToolbar /></div></SkeletonPanel>}
  <SkeletonStats count={view === "dashboard" ? 7 : view === "reports" ? 4 : 3} className={analytics ? "grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4" : "grid gap-3.5 sm:grid-cols-3"} />
  {view === "rentals" && <><section className="pt-3"><SkeletonHeading /><div className="mt-4"><SkeletonPortfolioCards /></div></section><section className="space-y-4 pt-3"><SkeletonHeading /><SkeletonToolbar count={4} /><SkeletonTable columns={7} /></section></>}
  {view === "dashboard" && <section className="grid gap-4 xl:grid-cols-2">{[0,1,2,3].map(i=><SkeletonListPanel key={i} />)}</section>}
  {view === "reports" && <><section className="grid gap-4 lg:grid-cols-2"><SkeletonListPanel /><SkeletonListPanel /></section><SkeletonPanel><SkeletonHeading /><div className="mt-4"><SkeletonTable columns={6} /></div></SkeletonPanel></>}
  {view === "workspace" && <><SkeletonToolbar count={4} /><SkeletonPanel><SkeletonHeading /><div className="mt-5"><SkeletonTable columns={6} /></div></SkeletonPanel></>}
 </div></main>;
}
