import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonBlock } from "@/components/LoadingSkeleton";
import PurchasingRecordsSkeleton from "./PurchasingRecordsSkeleton";
export default function PurchasingPageSkeleton() { return <div role="status" aria-busy="true" aria-label="Loading purchasing" className="min-h-full space-y-4 bg-white p-4 sm:p-6"><CeoPageHeroSkeleton action="button" /><SkeletonBlock className="h-10 w-full max-w-sm" /><PurchasingRecordsSkeleton /></div>; }
