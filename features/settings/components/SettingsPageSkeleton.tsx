import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";

function Field() { return <div className="grid gap-2"><Block className="h-5 w-28" /><Block className="h-12 w-full rounded-[14px]" /></div>; }

export default function SettingsPageSkeleton() {
  return <div role="status" aria-label="Loading settings" className="min-h-full space-y-7 bg-[#f6f8f8] p-4 sm:p-6 lg:p-8">
    <header className="rounded-3xl bg-[#075e5b] p-6 sm:p-8"><Block light className="h-4 w-20" /><Block light className="mt-3 h-9 w-40 sm:h-10" /><Block light className="mt-3 h-5 w-64" /></header>
    <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <SkeletonPanel className="p-6 sm:p-7"><Block className="h-7 w-20" /><Block className="mt-1 h-5 w-56" />
        <div className="mt-6 grid gap-6"><div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-2xl bg-slate-50 px-5 py-5"><Block className="h-20 w-20 rounded-full" /><Block className="mt-4 h-10 w-40" /><Block className="mt-2 h-4 w-32" /></div>
          <div className="grid gap-4"><Field /><div className="grid gap-4 md:grid-cols-2"><Field /><Field /></div><Field /><Block className="mt-1 h-11 w-36" /></div>
        </div>
      </SkeletonPanel>
      <SkeletonPanel className="p-6 sm:p-7"><Block className="h-7 w-24" /><Block className="mt-1 h-5 w-52" /><div className="mt-5 grid gap-4"><Field /><Field /></div><Block className="mt-5 h-10 w-full" /><Block className="mt-4 h-11 w-44" /></SkeletonPanel>
    </section>
  </div>;
}
