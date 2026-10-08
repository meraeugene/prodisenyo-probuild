import { ROLE_FEATURES } from "../utils/homeFeatures";
import type { AppRole } from "@/types/database";
import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";

export default function HomePageSkeleton({ role }: { role: AppRole | null }) {
  const employee = role === "employee";
  const count = employee ? 2 : role ? ROLE_FEATURES[role].length : 3;
  return <main role="status" aria-busy="true" aria-label="Loading home workspace" className={employee ? "min-h-full space-y-7 p-4 sm:p-6 lg:p-8" : "min-h-full space-y-6 p-4 sm:p-6"}>
    <CeoPageHeroSkeleton action={employee ? "button" : "none"} />
    <section>
      {employee ? <Block className="mb-5 h-7 w-32" /> : <div className="mb-4"><Block className="h-4 w-36" /><Block className="mt-2 h-8 w-44" /></div>}
      <div className={`grid ${employee ? "gap-5 md:grid-cols-2" : "gap-4 md:grid-cols-2 xl:grid-cols-3"}`}>
        {Array.from({ length: count }, (_, index) => employee
          ? <div key={index} className="flex min-w-0 flex-col"><div className="flex-1 p-6"><Block className="h-7 w-44" /><Block className="mt-2 h-6 w-full max-w-sm" /></div><div className="flex items-center justify-between px-6 py-4"><Block className="h-5 w-32" /><Block className="h-4 w-4" /></div></div>
          : <div key={index} className="flex min-h-[180px] min-w-0 flex-col justify-between p-5"><Block className="h-7 w-44" /><div className="mt-3 space-y-1"><Block className="h-5 w-full" /><Block className="h-5 w-4/5" /></div><Block className="ml-auto mt-2 h-4 w-4" /></div>)}
      </div>
    </section>
  </main>;
}
