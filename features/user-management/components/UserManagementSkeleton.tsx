import DashboardPageHero from "@/components/DashboardPageHero";
import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";

export default function UserManagementSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading user management"
      className="space-y-4 overflow-x-hidden p-0 sm:p-6"
    >
      <DashboardPageHero
        eyebrow="Admin"
        title="User Management"
        description="Create, update, and manage user accounts for all application roles, including GMEA."
      />
      <section className="rounded-none border border-apple-mist bg-white p-4 sm:rounded-[22px] sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <Block className="h-4 w-20" />
            <Block className="mt-2 h-7 w-28" />
          </div>
          <Block className="h-10 w-28 rounded-xl" />
        </div>
        <div className="mt-5 grid gap-2 md:grid-cols-[minmax(240px,1fr)_190px_160px]">
          <Block className="h-10 rounded-xl" />
          <Block className="h-10 rounded-xl" />
          <Block className="h-10 rounded-xl" />
        </div>
        <div className="mt-4 overflow-hidden rounded-[16px] border border-apple-mist">
          <div className="h-9 bg-slate-50" />
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="grid grid-cols-5 gap-3 border-t border-slate-100 px-3 py-4"
            >
              {[0, 1, 2, 3, 4].map((column) => (
                <Block key={column} className="h-5 w-full max-w-28" />
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
