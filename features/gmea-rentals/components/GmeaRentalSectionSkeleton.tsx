import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonBlock, SkeletonPanel } from "@/components/LoadingSkeleton";
import { SkeletonStats, SkeletonTable } from "@/components/PageSkeletonParts";
import type { RentalSection } from "../utils/rentalSections";

export default function GmeaRentalSectionSkeleton({ section }: { section: RentalSection }) {
  return <main role="status" aria-busy="true" aria-label={"Loading rental " + section} className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8">
    <div className="mx-auto max-w-[1440px] space-y-4">
      <CeoPageHeroSkeleton variant="workspace" action="none" titleWidth="w-56" />
      <SkeletonPanel className="space-y-5 p-4 sm:p-5">
        {section !== "equipment" && <div className="flex flex-wrap gap-2"><SkeletonBlock className="h-9 w-28" /><SkeletonBlock className="h-9 w-24" /></div>}
        <div className="flex flex-wrap gap-3"><SkeletonBlock className="h-10 w-40" /><SkeletonBlock className="h-10 w-60" /></div>
        <SkeletonStats count={section === "income" ? 6 : 3} className={`grid gap-3 sm:grid-cols-2 ${section === "income" ? "xl:grid-cols-3" : "xl:grid-cols-4"}`} />
        <SkeletonTable columns={6} minWidth={720} />
      </SkeletonPanel>
    </div>
  </main>;
}
