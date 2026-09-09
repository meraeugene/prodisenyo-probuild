import DashboardPageHero from "@/components/DashboardPageHero";
import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
export default function UserManagementSkeleton() {
  return <div role="status" aria-label="Loading user management" className="space-y-4 p-0 sm:p-6">
    <DashboardPageHero eyebrow="Admin" title="User Management" description="Create, update, and manage user accounts for all application roles, including GMEA." />
    <section className="grid gap-4 2xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="min-w-0 rounded-none border border-apple-mist bg-white p-4 sm:rounded-[22px] sm:p-6"><Block className="h-4 w-24" /><Block className="mt-2 h-7 w-44" /><div className="mt-6 grid gap-5">{[0,1,2,3,4].map(i => <div key={i}><Block className="h-5 w-32" /><Block className="mt-2 h-12 w-full rounded-xl" /></div>)}</div><Block className="mt-5 h-11 w-full rounded-xl" /></div>
      <section className="min-w-0 rounded-none border border-apple-mist bg-white p-5 sm:rounded-[22px]"><div className="mb-4 flex justify-between"><div><Block className="h-4 w-20" /><Block className="mt-2 h-7 w-16" /></div><Block className="h-6 w-20 rounded-full" /></div><div className="overflow-hidden rounded-[18px] border border-apple-mist"><div className="min-w-[900px]"><div className="h-9 bg-slate-50" />{[0,1,2,3,4,5].map(i => <div key={i} className="grid grid-cols-6 gap-3 border-t border-slate-100 px-3 py-3">{[0,1,2,3,4,5].map(j => <Block key={j} className={j === 5 ? "h-9 w-9" : "h-5 w-24"} />)}</div>)}</div></div></section>
    </section>
  </div>;
}
