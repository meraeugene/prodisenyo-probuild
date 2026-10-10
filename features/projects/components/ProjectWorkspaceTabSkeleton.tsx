import ProjectOverviewSkeleton from "./ProjectOverviewSkeleton";
import ProjectContentSkeleton from "./ProjectContentSkeleton";
import CostTrackingSkeleton from "@/features/project-cost-tracking/components/CostTrackingSkeleton";
import { SkeletonBlock } from "@/components/LoadingSkeleton";

type WorkspaceTab =
  | "overview"
  | "activities"
  | "progress-updates"
  | "estimates"
  | "materials"
  | "documents"
  | "activity-log"
  | "cost-tracking";

export default function ProjectWorkspaceTabSkeleton({
  tab,
}: {
  tab: WorkspaceTab;
}) {
  if (tab === "materials" || tab === "documents" || tab === "activity-log") return <ProjectContentSkeleton tab={tab} />;
  if (tab === "overview") return <div role="status" aria-label="Loading project overview"><ProjectOverviewSkeleton /></div>;
  if (tab === "estimates") {
    return (
      <div
        aria-label="Loading estimates"
        aria-live="polite"
        data-skeleton-panel="true" className="skeleton-surface overflow-hidden rounded-2xl"
      >
        <div className="grid gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center lg:gap-10">
          <div>
            <Skeleton className="h-3 w-28" />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Skeleton className="h-8 w-56" strong />
              <Skeleton className="h-8 w-40 rounded-xl" />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3 sm:gap-6">
              {[0, 1, 2].map((item) => (
                <div key={item}>
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-2 h-5 w-32" strong />
                </div>
              ))}
            </div>
          </div>
          <div className="pt-5 lg:py-3 lg:pl-10">
            <Skeleton className="h-3 w-36 lg:ml-auto" />
            <Skeleton className="mt-3 h-9 w-48 lg:ml-auto" strong />
          </div>
        </div>
        <div className="flex flex-col gap-3 px-5 py-4 sm:px-6 lg:flex-row lg:justify-between">
          <Skeleton className="h-10 w-full rounded-xl sm:w-36" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Skeleton className="h-10 w-full rounded-xl sm:w-28" />
            <Skeleton className="h-10 w-full rounded-xl sm:w-28" />
          </div>
        </div>
      </div>
    );
  }

  if (tab === "cost-tracking") return <CostTrackingSkeleton />;

  return (
    <div role="status" aria-busy="true" aria-label={`Loading ${tab}`} aria-live="polite" className="space-y-4">
      <div data-skeleton-panel="true" className="skeleton-surface rounded-xl p-4">
        <Skeleton className="h-4 w-72" />
      </div>
      <ListSkeleton rows={4} />
    </div>
  );
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <section data-skeleton-panel="true" className="skeleton-surface overflow-hidden rounded-xl p-5">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-6 w-44" strong />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="mt-5 divide-y divide-slate-100">
        {Array.from({ length: rows }, (_, item) => (
          <div
            key={item}
            className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_9rem_7rem]"
          >
            <div>
              <Skeleton className="h-4 w-2/3" strong />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </section>
  );
}

function Skeleton({
  className,
}: {
  className: string;
  strong?: boolean;
}) {
  return <SkeletonBlock className={className} />;
}
