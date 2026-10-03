import styles from "./projects.module.css";
import type { ProjectRecord } from "../types";

export default function CeoProjectsSummary({ projects }: { projects: ProjectRecord[] }) {
  const entries = [
    { label: "Total Projects", value: projects.length, note: "All project records", tone: "text-emerald-700" },
    { label: "Active Projects", value: projects.filter((project) => project.status === "active").length, note: "Currently in progress", tone: "text-emerald-700" },
    { label: "Pending Estimates", value: projects.filter((project) => project.status === "planning").length, note: "Awaiting cost estimate", tone: "text-rose-600" },
    { label: "Completed Projects", value: projects.filter((project) => project.status === "completed").length, note: "Successfully delivered", tone: "text-emerald-700" },
    { label: "On Hold", value: projects.filter((project) => project.status === "on_hold").length, note: "Requires follow-up", tone: "text-rose-600" },
  ];

  return (
    <section aria-label="Project portfolio summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {entries.map((entry) => (
        <article key={entry.label} className={`${styles.panel} px-5 py-5`}>
          <p className="text-[15px] font-medium text-[#365b56]">{entry.label}</p>
          <div className="mt-3">
            <p className="text-[30px] font-semibold leading-none tracking-[-0.045em] text-slate-950 tabular-nums">{entry.value}</p>
            <p className="mt-2 text-[13px] text-[#53736f]">{entry.note}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
