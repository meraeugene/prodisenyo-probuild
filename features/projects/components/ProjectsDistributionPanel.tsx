import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import styles from "./projects.module.css";
export default function ProjectsDistributionPanel({ title, data, total }: { title: string; data: Array<{ name: string; value: number; color: string }>; total: number }) {
  return (
    <article className={`${styles.panel} p-5`}>
      <h2 className="text-[18px] font-semibold tracking-tight text-[#1d1d1f]">{title}</h2>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        <div className="relative h-28 w-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={total ? data : [{ name: "Empty", value: 1, color: "#e6f3ef" }]} dataKey="value" innerRadius={38} outerRadius={51} stroke="#fff" strokeWidth={2}>{(total ? data : [{ name: "Empty", color: "#e6f3ef" }]).map((item) => <Cell key={item.name} fill={item.color} />)}</Pie></PieChart></ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-xl text-slate-950">{total}</strong><span className="text-xs text-slate-500">projects</span></div>
        </div>
        <div className="min-w-[160px] flex-1 divide-y divide-slate-100">
          {data.map((item) => <div key={item.name} className="grid grid-cols-[10px_1fr_auto_auto] items-center gap-2 py-2 text-xs"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-[#53736f]">{item.name}</span><strong className="text-slate-900">{item.value}</strong><span className="w-9 text-right text-slate-400">{total ? Math.round(item.value / total * 100) : 0}%</span></div>)}
        </div>
      </div>
    </article>
  );
}

