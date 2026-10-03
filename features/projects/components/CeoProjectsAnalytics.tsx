"use client";

import ProjectsDistributionPanel from "./ProjectsDistributionPanel";
import { CHART_TOOLTIP_STYLE } from "@/lib/chartTheme";
import styles from "./projects.module.css";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProjectRecord } from "../types";
import { buildCeoProjectsAnalytics } from "../utils/ceoProjectsAnalytics";
import {
  formatCompactProjectCurrency,
  formatProjectCurrency,
} from "../utils/projectPresentation";

export default function CeoProjectsAnalytics({ projects }: { projects: ProjectRecord[] }) {
  const [months, setMonths] = useState(6);
  const data = useMemo(() => buildCeoProjectsAnalytics(projects, months), [months, projects]);
  return (
    <section className="grid gap-4 xl:grid-cols-[1.4fr_.8fr]">
      <article className={`${styles.panel} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-[18px] font-semibold tracking-tight text-[#1d1d1f]">Budget vs Actual Spend</h2><div className="mt-3 flex gap-5 text-xs text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#076d69]" />Actual Spend</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#b8ded6]" />Budget</span></div></div><select aria-label="Chart time range" value={months} onChange={(event) => setMonths(Number(event.target.value))} className={styles.control}><option value={6}>Last 6 months</option><option value={12}>Last 12 months</option></select></div>
        <div className="mt-3 h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.trend}><CartesianGrid vertical={false} stroke="#edf3f1"  /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#53736f" }} /><YAxis width={58} axisLine={false} tickLine={false} tickFormatter={formatCompactProjectCurrency} tick={{ fontSize: 11, fill: "#53736f" }} /><Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => formatProjectCurrency(value)} /><Bar dataKey="budget" name="Budget" fill="#b8ded6" radius={[3,3,0,0]} maxBarSize={30} /><Bar dataKey="spent" name="Actual Spend" fill="#076d69" radius={[3,3,0,0]} maxBarSize={30} /></BarChart></ResponsiveContainer></div>
        <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">{[[formatProjectCurrency(data.totalBudget), "Total Budget"], [formatProjectCurrency(data.totalSpent), "Actual Spend"], [`${data.overallProgress}%`, "Overall Progress"]].map(([value, label], index) => <div key={label} className={index ? "border-t border-slate-100 px-5 sm:border-l sm:border-t-0" : "px-1 sm:pr-5"}><strong className="text-base font-semibold text-[#1d1d1f]">{value}</strong><p className="mt-1 text-xs text-slate-500">{label}</p></div>)}</div>
      </article>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><ProjectsDistributionPanel title="Project Status" data={data.statuses} total={projects.length} /><ProjectsDistributionPanel title="Delivery Risk" data={data.risks} total={projects.length} /></div>
    </section>
  );
}
