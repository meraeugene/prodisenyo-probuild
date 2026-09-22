import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";

function ProjectCardSkeleton() {
  return (
    <section className="overflow-hidden rounded-[16px] bg-slate-50/70 shadow-[0_8px_22px_-20px_rgba(15,23,42,.25)]">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <Block className="h-4 w-4 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Block className="h-5 w-36" />
              <Block className="mt-2 h-3 w-full max-w-72" />
            </div>
          </div>
          <Block className="h-8 w-8 shrink-0 rounded-lg" />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Block className="h-4 w-36" />
          <Block className="h-4 w-44" />
        </div>
        <div className="mt-4 grid grid-cols-2 pt-4">
          <div className="pr-4">
            <Block className="h-3 w-28" />
            <Block className="mt-2 h-6 w-32" />
          </div>
          <div className="pl-4">
            <Block className="h-3 w-20" />
            <Block className="mt-2 h-6 w-28" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between bg-slate-100/60 px-5 py-3">
        <Block className="h-4 w-24" />
        <Block className="h-8 w-16 rounded-lg" />
      </div>
    </section>
  );
}

export default function GmeaProjectsPageSkeleton() {
  return (
    <div role="status" aria-label="Loading GMEA projects" className="min-h-full bg-white px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8">
      <div className="mx-auto max-w-[1440px] space-y-4">
        <CeoPageHeroSkeleton action="button" />

        <section className="grid gap-3.5 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <section key={index} className="min-h-[84px] rounded-[12px] bg-slate-50/70 px-5 py-4 shadow-[0_8px_22px_-20px_rgba(15,23,42,.22)]">
              <div className="flex items-center gap-2">
                <Block className="h-3 w-3 rounded-full" />
                <Block className="h-3 w-28" />
              </div>
              <Block className="mt-2 h-7 w-32" />
            </section>
          ))}
        </section>

        <section className="pt-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Block className="h-6 w-32" />
              <Block className="mt-2 h-3 w-40" />
            </div>
            <div className="flex w-full flex-col gap-2.5 sm:max-w-[560px] sm:flex-row">
              <Block className="h-11 min-w-0 flex-1 rounded-xl" />
              <Block className="h-11 w-full shrink-0 rounded-xl sm:w-52" />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => <ProjectCardSkeleton key={index} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
