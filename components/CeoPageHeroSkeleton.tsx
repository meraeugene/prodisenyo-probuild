import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";

export default function CeoPageHeroSkeleton({ action = "status" }: { action?: "status" | "button" | "none" }) {
  return <header role="status" aria-busy="true" aria-label="Loading content" className="flex flex-wrap items-start justify-between gap-4 bg-white pb-2">
    <div className="min-w-0 flex-1"><Block className="mb-5 h-3 w-44" /><Block className="h-9 w-80" /><Block className="mt-3 h-4 w-full max-w-xl" /></div>
    {action !== "none" && <Block className="h-10 w-40 rounded-[10px] sm:mt-9" />}
  </header>;
}
