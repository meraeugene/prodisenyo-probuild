import Link from "next/link";
import {
  CalendarClock,
  CircleDollarSign,
  FolderPlus,
  ReceiptText,
  Wrench,
} from "lucide-react";
import type { GmeaOverviewActivity, GmeaOverviewAlert } from "../types";

const activityIcons = {
  project: FolderPlus,
  payment: CircleDollarSign,
  expense: ReceiptText,
  rental: CalendarClock,
};

export default function GmeaOverviewOperations({
  activity,
  alerts,
}: {
  activity: GmeaOverviewActivity[];
  alerts: GmeaOverviewAlert[];
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
      <article className="rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)]">
        <div>
          <h2 className="text-[16px] font-bold tracking-[-0.025em] text-slate-950">
            Recent Activity
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Latest changes across both divisions.
          </p>
        </div>
        <div className="mt-3 divide-y divide-slate-100">
          {activity.slice(0, 6).map((item) => {
            const Icon = activityIcons[item.kind];
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex gap-3 py-3 transition hover:bg-slate-50"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-[#087d76]">
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <time
                      dateTime={item.date}
                      className="shrink-0 text-[10px] text-slate-400"
                    >
                      {formatActivityDate(item.date)}
                    </time>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {item.detail} / {item.division}
                  </p>
                </div>
              </Link>
            );
          })}
          {!activity.length && (
            <p className="py-8 text-center text-sm text-slate-500">
              No activity recorded yet.
            </p>
          )}
        </div>
      </article>
      <article className="rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)]">
        <div className="flex items-center gap-2">
          <Wrench size={16} className="text-[#087d76]" />
          <div>
            <h2 className="text-[16px] font-bold tracking-[-0.025em] text-slate-950">
              Upcoming / Alerts
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Real operational items needing attention.
            </p>
          </div>
        </div>
        <div className="mt-3 divide-y divide-slate-100">
          {alerts.slice(0, 6).map((alert) => (
            <Link
              key={alert.id}
              href={alert.href}
              className="flex items-start gap-3 py-3 transition hover:bg-slate-50"
            >
              <span
                className={
                  "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full " +
                  alertTone(alert.tone)
                }
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {alert.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{alert.detail}</p>
              </div>
            </Link>
          ))}
          {!alerts.length && (
            <p className="py-8 text-center text-sm text-slate-500">
              No upcoming items or alerts.
            </p>
          )}
        </div>
      </article>
    </section>
  );
}

function formatActivityDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function alertTone(tone: GmeaOverviewAlert["tone"]) {
  return tone === "rose"
    ? "bg-rose-500"
    : tone === "amber"
      ? "bg-amber-500"
      : "bg-sky-500";
}
