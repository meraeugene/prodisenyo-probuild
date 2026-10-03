import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";

export default function CeoPageHeroSkeleton({
  action = "status",
}: {
  action?: "status" | "button" | "none";
}) {
  return (
    <header className="flex min-h-[190px] flex-col justify-center rounded-[22px] bg-[#075e5b] px-6 py-7 sm:min-h-[210px] sm:px-8 sm:py-8">
      <div role="status" aria-busy="true" aria-label="Loading content" className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <Block light className="h-3 w-44" />
          <Block light className="mt-3 h-10 w-80" />
          <Block light className="mt-3 h-4 w-full max-w-xl" />
        </div>
        {action === "status" ? (
          <div className="flex h-[74px] w-[230px] items-center gap-3 rounded-[14px] border border-white/20 bg-white/10 px-4">
            <Block light className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="flex-1">
              <Block light className="h-3 w-28" />
              <Block light className="mt-2 h-6 w-20" />
            </div>
          </div>
        ) : action === "button" ? (
          <Block light className="h-11 w-40 rounded-xl" />
        ) : null}
      </div>
    </header>
  );
}
