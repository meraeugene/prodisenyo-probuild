import Link from "next/link";
import { ArrowRight, Calculator, CalendarClock, PackageX } from "lucide-react";
import type { EngineerDashboardAlert } from "@/features/engineer-dashboard/types";
import styles from "@/components/workspace/workspace.module.css";

const icons = { estimate: Calculator, material: PackageX, schedule: CalendarClock };

export default function EngineerDashboardAlerts({ alerts }: { alerts: EngineerDashboardAlert[] }) {
  return (
    <section className={`${styles.panel} flex min-h-72 flex-col p-5`}>
      <h2 className={styles.sectionTitle}>Needs attention</h2>
      <p className={styles.sectionDescription}>Returned estimates, material requests, and schedule alerts.</p>
      <div className="mt-4 flex-1 space-y-3">
        {alerts.length === 0 ? <p className="rounded-xl bg-teal-50 px-4 py-8 text-center text-sm text-teal-700">No workflow items need attention.</p> : alerts.slice(0, 4).map((alert) => {
          const Icon = icons[alert.kind];
          return <Link key={alert.id} href={alert.href} className="group flex gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-amber-200 hover:bg-amber-50/40"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Icon size={17} /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900">{alert.title}</p><p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">{alert.detail}</p></div><ArrowRight size={14} className="mt-1 shrink-0 text-slate-300 transition  group-hover:text-amber-600" /></Link>;
        })}
      </div>
    </section>
  );
}
