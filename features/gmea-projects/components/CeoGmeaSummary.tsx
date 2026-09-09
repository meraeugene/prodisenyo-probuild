import { FolderKanban, Coins, WalletCards, Landmark } from "lucide-react";
import { formatMoney } from "../utils/gmeaCalculations";

export default function CeoGmeaSummary({ count, contract, expenses, outstanding }: {
  count: number; contract: number; expenses: number; outstanding: number;
}) {
  const entries = [
    { label: "Total Projects", value: String(count), note: "Across the GMEA portfolio", icon: FolderKanban, tone: "bg-teal-50 text-teal-700" },
    { label: "Total Contract Amount", value: formatMoney(contract), note: "Combined contract value", icon: Coins, tone: "bg-amber-50 text-amber-600" },
    { label: "Total Expenses", value: formatMoney(expenses), note: "Including applicable VAT", icon: WalletCards, tone: "bg-sky-50 text-sky-600" },
    { label: "Outstanding Collections", value: formatMoney(outstanding), note: "Remaining contract payments", icon: Landmark, tone: "bg-violet-50 text-violet-600" },
  ];
  return (
    <section aria-label="GMEA portfolio summary" className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
      {entries.map(({ label, value, note, icon: Icon, tone }) => (
        <article key={label} className="flex min-w-0 gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_-25px_rgba(15,23,42,.2)]">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={21} aria-hidden="true" /></span>
          <div className="min-w-0">
            <h2 className="text-xs font-medium text-slate-500">{label}</h2>
            <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 tabular-nums">{value}</p>
            <p className="mt-1.5 text-[10px] text-slate-400">{note}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
