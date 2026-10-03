import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { AttendanceAnalyticsLoadingState } from "./AttendanceAnalyticsLoadingState";
export default function AttendanceAnalyticsPageSkeleton() { return <div role="status" aria-busy="true" aria-label="Loading attendance analytics" className="space-y-4"><CeoPageHeroSkeleton action="none" /><AttendanceAnalyticsLoadingState /></div>; }
