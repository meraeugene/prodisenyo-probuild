import CeoPageHeroSkeleton from "@/components/CeoPageHeroSkeleton";
import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
import PayrollReportsArchiveSkeleton from "./PayrollReportsArchiveSkeleton";

export default function PayrollApprovalsPageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading payroll approvals"
      className="min-h-full space-y-4 bg-white p-4 sm:p-6 lg:p-8"
    >
      <CeoPageHeroSkeleton action="status" />

      <section className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className={`min-w-0 px-5 py-4 ${index ? "border-t border-slate-200 sm:border-l xl:border-t-0" : ""}`}
          >
            <Block className="h-3 w-28" />
            <Block className="mt-2 h-7 w-24" />
            <div className="mt-3 flex items-end justify-between gap-3">
              <Block className="h-3 w-24" />
              <Block className="h-7 w-20" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.35fr_.85fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex justify-between gap-4">
            <div><Block className="h-5 w-40" /><Block className="mt-3 h-3 w-48" /></div>
            <Block className="h-9 w-28" />
          </div>
          <div className="mt-5 flex h-56 items-end gap-5 border-b border-l border-slate-100 p-4">
            {["h-[35%]", "h-[48%]", "h-[60%]", "h-[70%]", "h-[82%]", "h-[92%]"].map((height) => <Block key={height} className={`${height} flex-1 rounded-b-none`} />)}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4"><Block className="h-10" /><Block className="h-10" /><Block className="h-10" /></div>
        </article>
        <div className="grid gap-3">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <Block className="h-5 w-32" />
            <div className="mt-4 grid grid-cols-[128px_1fr] items-center gap-4">
              <div className="h-28 w-28 rounded-full border-[18px] border-slate-200/70" />
              <div className="space-y-3">{Array.from({ length: 4 }, (_, index) => <Block key={index} className="h-4 w-full" />)}</div>
            </div>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <Block className="h-4 w-44" />
            <div className="mt-4 space-y-3">{Array.from({ length: 4 }, (_, index) => <Block key={index} className="h-3 w-full" />)}</div>
          </article>
        </div>
      </section>

      <PayrollReportsArchiveSkeleton />
    </div>
  );
}
