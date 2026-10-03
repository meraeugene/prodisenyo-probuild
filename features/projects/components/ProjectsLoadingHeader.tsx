import { SkeletonBlock } from "@/components/LoadingSkeleton";

export default function ProjectsLoadingHeader() {
  return <div className="space-y-3 pb-2"><SkeletonBlock className="mb-5 h-3 w-48" /><SkeletonBlock className="h-9 w-40" /><SkeletonBlock className="h-4 w-full max-w-lg" /></div>;
}
