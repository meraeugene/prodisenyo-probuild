import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { AttendanceAnalyticsLoadingState } from "./AttendanceAnalyticsLoadingState";
import { SkeletonBlock } from "@/components/LoadingSkeleton";
export default function AttendanceAnalyticsPageSkeleton() { return <div role="status" aria-busy="true" aria-label="Loading attendance analytics" className="space-y-4"><CeoPageHeroSkeleton action="none" /><div className="flex flex-wrap items-center gap-3 p-4"><SkeletonBlock className="h-5 w-28" /><SkeletonBlock className="h-11 w-64" /></div><AttendanceAnalyticsLoadingState /></div>; }
