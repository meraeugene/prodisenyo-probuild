import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import {
  SkeletonBlock as Block,
  SkeletonPanel,
} from "@/components/LoadingSkeleton";

export default function ProjectsPageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading projects"
      className="min-h-full space-y-4 bg-white p-4 sm:p-6 lg:p-8"
    >
      <CeoPageHeroSkeleton action="button" />

      <section className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className={`min-h-[92px] px-5 py-4 ${index ? "border-t border-slate-200 sm:border-l xl:border-t-0" : ""}`}
          >
            <Block className="h-3 w-28" />
            <div className="mt-3 flex items-end gap-4">
              <Block className="h-8 w-12" />
              <Block className="h-3 w-24" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.4fr_.8fr]">
        <SkeletonPanel className="h-[350px] rounded-xl p-5">
          <div className="flex justify-between gap-3">
            <Block className="h-5 w-44" />
            <Block className="h-9 w-28" />
          </div>
          <Block className="mt-5 h-56 w-full" />
          <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
            {[0, 1, 2].map((index) => (
              <Block key={index} className="h-9 w-28" />
            ))}
          </div>
        </SkeletonPanel>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {[0, 1].map((index) => (
            <SkeletonPanel key={index} className="h-[169px] rounded-xl p-4">
              <Block className="h-5 w-32" />
              <div className="mt-4 flex items-center gap-5">
                <Block className="h-28 w-28 rounded-full" />
                <div className="flex-1 space-y-3">
                  {[0, 1, 2].map((row) => (
                    <Block key={row} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            </SkeletonPanel>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:justify-between">
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((index) => (
              <Block key={index} className="h-9 w-24" />
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Block className="h-9 w-64" />
            <Block className="h-9 w-36" />
            <Block className="h-9 w-36" />
          </div>
        </div>
        <div className="border-t border-slate-200">
          <div className="h-10 bg-slate-50" />
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="grid grid-cols-7 gap-4 border-t border-slate-100 px-4 py-4"
            >
              {Array.from({ length: 7 }, (_, cell) => (
                <Block key={cell} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
