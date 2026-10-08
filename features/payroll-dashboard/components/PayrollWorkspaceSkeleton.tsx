import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonStats } from "@/components/PageSkeletonParts";
import WorkspaceListSkeleton from "@/components/workspace/WorkspaceListSkeleton";
export default function PayrollWorkspaceSkeleton() {
  return <main role="status" aria-busy="true" aria-label="Loading payroll workspace" className="min-h-screen px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
    <CeoPageHeroSkeleton action="button" />
    <SkeletonStats count={2} className="mt-4 grid gap-4 md:grid-cols-2" />
    <div className="mt-6"><WorkspaceListSkeleton columns={6} tabs={5} tabLabels={["All payrolls", "Drafts", "Awaiting CEO", "Approved", "Returned"]} /></div>
  </main>;
}
