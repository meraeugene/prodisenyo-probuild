import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";

export default function GmeaProjectsPageSkeleton() {
  return (
    <div role="status" aria-label="Loading GMEA projects" className="min-h-full bg-slate-50/40 p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <CeoPageHeroSkeleton action="none" />
        <section className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className={`px-5 py-4 ${index ? "border-t border-slate-200 sm:border-l xl:border-t-0" : ""}`}><Block className="h-3 w-32" /><Block className="mt-2 h-7 w-28" /><div className="mt-3 flex items-end justify-between gap-3"><Block className="h-3 w-28" /><Block className="h-7 w-20" /></div></div>)}
        </section>
        <section className="grid gap-3 xl:grid-cols-[1.35fr_.85fr]">
          <SkeletonPanel className="h-[350px] rounded-xl p-5"><div className="flex justify-between gap-4"><div><Block className="h-5 w-48" /><Block className="mt-3 h-3 w-52" /></div><Block className="h-9 w-28" /></div><Block className="mt-5 h-64 w-full" /></SkeletonPanel>
          <SkeletonPanel className="h-[350px] rounded-xl p-5"><Block className="h-5 w-36" /><div className="mt-6 grid grid-cols-[160px_1fr] items-center gap-5"><div className="h-40 w-40 rounded-full border-[22px] border-slate-200/70" /><div className="space-y-5">{Array.from({ length: 3 }, (_, index) => <Block key={index} className="h-5 w-full" />)}</div></div></SkeletonPanel>
        </section>
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:justify-between"><div className="flex gap-2">{Array.from({ length: 4 }, (_, index) => <Block key={index} className="h-10 w-28" />)}</div><div className="grid gap-2 sm:grid-cols-3"><Block className="h-10 w-64" /><Block className="h-10 w-40" /><Block className="h-10 w-40" /></div></div>
          <div className="border-t border-slate-200"><div className="h-10 bg-slate-50" />{Array.from({ length: 4 }, (_, index) => <div key={index} className="grid grid-cols-8 gap-4 border-t border-slate-100 px-4 py-4">{Array.from({ length: 8 }, (_, cell) => <Block key={cell} className="h-4 w-full" />)}</div>)}</div>
        </section>
      </div>
    </div>
  );
}
