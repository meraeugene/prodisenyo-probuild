import { SkeletonBlock } from "@/components/LoadingSkeleton";

export default function ProjectsLoadingHeader() {
  return <header className="pb-2"><div className="mb-5 flex h-4 items-center"><SkeletonBlock className="h-3 w-48" /></div><SkeletonBlock className="h-[42px] w-40 sm:h-12" /><div className="mt-1 flex h-6 items-center"><SkeletonBlock className="h-3.5 w-full max-w-lg" /></div></header>;
}
