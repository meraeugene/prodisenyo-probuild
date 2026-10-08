import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";
import { SkeletonStats } from "@/components/PageSkeletonParts";
import WorkspaceListSkeleton from "@/components/workspace/WorkspaceListSkeleton";
import { CEO_PROJECT_FILTERS } from "../utils/ceoProjectPortfolio";

export default function ProjectsPageSkeleton() {
  return <div role="status" aria-busy="true" aria-label="Loading projects" className="min-h-full space-y-5 px-4 pb-8 pt-5 sm:px-6 sm:pb-9 sm:pt-6 xl:px-7">
    <CeoPageHeroSkeleton variant="workspace" action="button" titleWidth="w-28" />
    <SkeletonStats helper count={5} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" />
    <section className="grid gap-4 xl:grid-cols-[1.4fr_.8fr]">
      <SkeletonPanel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><Block className="h-7 w-48" /><Block className="mt-3 h-4 w-48" /></div><Block className="h-10 w-36" /></div>
        <Block className="mt-3 h-56 w-full" />
        <div className="grid gap-3 pt-4 sm:grid-cols-3">{[0, 1, 2].map(index => <div key={index}><Block className="h-6 w-28" /><Block className="mt-1 h-4 w-24" /></div>)}</div>
      </SkeletonPanel>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">{[0, 1].map(index => <SkeletonPanel key={index} className="p-5">
        <Block className="h-7 w-32" /><div className="mt-3 flex flex-wrap items-center justify-center gap-3"><Block className="h-28 w-28 shrink-0 rounded-full" /><div className="min-w-[160px] flex-1 space-y-3">{[0, 1, 2].map(row => <Block key={row} className="h-4 w-full" />)}</div></div>
      </SkeletonPanel>)}</div>
    </section>
    <WorkspaceListSkeleton columns={9} tabs={5} tabLabels={CEO_PROJECT_FILTERS.map(tab => tab.label)} filterCount={2} minWidth={1060} firstColumnLines={2} rowHeight={64} />
  </div>;
}
