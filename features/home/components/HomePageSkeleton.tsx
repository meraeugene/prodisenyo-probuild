import { ROLE_FEATURES } from "../utils/homeFeatures";
import type { AppRole } from "@/types/database";
import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";
export default function HomePageSkeleton({ role }: { role: AppRole | null }) {
 const employee = role === "employee";
 const count = role ? ROLE_FEATURES[role].length : 3;
 return <main role="status" aria-busy="true" aria-label="Loading home workspace" className={employee ? "min-h-full space-y-7 bg-white p-4 sm:p-6 lg:p-8" : "min-h-full space-y-6 bg-white p-4 sm:p-6"}>
  <CeoPageHeroSkeleton action={employee ? "button" : "none"} />
  <section><Block className="h-6 w-44" />{!employee && <Block className="mt-2 h-7 w-56" />}<div className={"mt-5 grid " + (employee ? "gap-5 md:grid-cols-2" : "gap-4 md:grid-cols-2 xl:grid-cols-3")}>{Array.from({length:count},(_,i)=><SkeletonPanel key={i} className="flex min-h-[220px] flex-col rounded-[22px] p-6"><Block className="mt-5 h-6 w-48" /><Block className="mt-3 h-4 w-full" /><Block className="mt-2 h-4 w-4/5" /><div className="mt-auto flex justify-between border-t border-slate-100 pt-4"><Block className="h-4 w-28" /><Block className="h-5 w-5" /></div></SkeletonPanel>)}</div></section>
 </main>;
}
