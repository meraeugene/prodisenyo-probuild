import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";
import { SkeletonListPanel } from "@/components/PageSkeletonParts";
export default function OvertimeRequestPageSkeleton() {
 return <div role="status" aria-busy="true" aria-label="Loading overtime requests" className="p-0 sm:p-6 xl:flex xl:flex-col"><CeoPageHeroSkeleton action="none" /><div className="mt-4 grid gap-4 xl:grid-cols-[1.08fr_0.92fr] xl:items-stretch"><SkeletonPanel className="h-fit rounded-none p-5 sm:rounded-[16px]"><Block className="h-6 w-52" /><div className="mt-4 grid gap-3 md:grid-cols-2">{[0,1,2,3,4].map(i=><div key={i}><Block className="h-4 w-24" /><Block className="mt-2 h-11 w-full" /></div>)}<div className="md:col-span-2"><Block className="h-4 w-24" /><Block className="mt-2 h-24 w-full" /></div><Block className="mt-2 h-10 w-40 md:col-span-2" /></div></SkeletonPanel><SkeletonListPanel rows={3} /></div></div>;
}
