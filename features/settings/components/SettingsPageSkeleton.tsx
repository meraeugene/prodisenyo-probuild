import { SkeletonBlock as Block, SkeletonPanel } from "@/components/LoadingSkeleton";

function Field() {
  return <div className="grid gap-2"><Block className="h-4 w-28" /><Block className="h-10 w-full rounded-lg" /></div>;
}

export default function SettingsPageSkeleton() {
  return (
    <div role="status" aria-label="Loading settings" className="min-h-screen space-y-7 bg-[#f5f7f9] p-4 sm:p-6 lg:p-8">
      <header className="px-1 pt-1">
        <Block className="h-3 w-16" />
        <Block className="mt-2 h-10 w-36" />
        <Block className="mt-1 h-5 w-64 max-w-full" />
      </header>
      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.28fr)_minmax(0,1fr)]">
        <SkeletonPanel className="p-5 sm:p-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div><Block className="h-6 w-44" /><Block className="mt-1 h-4 w-56 max-w-full" /></div>
            <Block className="h-10 w-32 rounded-lg" />
          </div>
          <div className="my-6 flex flex-wrap items-center gap-6">
            <Block className="h-28 w-28 rounded-full" />
            <div><Block className="h-4 w-24" /><Block className="mt-2 h-4 w-44" /><Block className="mt-3 h-10 w-40 rounded-lg" /></div>
          </div>
          <div className="grid gap-4"><Field /><div className="grid gap-4 md:grid-cols-2"><Field /><Field /></div><Field /></div>
        </SkeletonPanel>
        <SkeletonPanel className="p-5 sm:p-6">
          <div className="flex items-center gap-3"><Block className="h-10 w-10 rounded-lg" /><div><Block className="h-6 w-24" /><Block className="mt-1 h-4 w-48" /></div></div>
          <div className="mt-5 grid gap-4"><Field /><Block className="h-3 w-full" /><Field /></div>
          <Block className="mt-5 h-28 w-full rounded-lg" />
          <Block className="mt-4 h-10 w-44 rounded-lg" />
        </SkeletonPanel>
      </section>
    </div>
  );
}
