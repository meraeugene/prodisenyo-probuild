import Image from "next/image";
import { BarChart3 } from "lucide-react";

export default function PayrollAnalyticsHero({ periodLabel }: { periodLabel?: string }) {
  return (
    <header className="relative isolate overflow-hidden rounded-[22px] bg-[#075e5b] px-6 py-8 text-white shadow-[0_18px_45px_-32px_rgba(3,62,60,.7)] sm:px-9">
      <Image src="/gmea-portfolio-architecture.png" alt="" fill priority sizes="(min-width: 1024px) calc(100vw - 320px), 100vw" className="-z-20 object-cover object-right" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,83,79,.98)_0%,rgba(3,91,87,.9)_40%,rgba(3,82,79,.46)_75%,rgba(3,74,71,.62)_100%)]" />
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/75">Data analytics</p>
          <h1 className="mt-3 text-[34px] font-bold leading-tight tracking-[-0.045em] sm:text-[42px]">Payroll analytics</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/82">Follow payroll costs, workforce distribution, overtime, and project spending across every saved pay period.</p>
        </div>
        <div className="flex max-w-full shrink-0 items-center gap-3 rounded-xl border border-white/15 bg-white/12 px-4 py-3 backdrop-blur-sm">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15"><BarChart3 size={20} aria-hidden="true" /></span>
          <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65">Selected period</p><p className="mt-1 max-w-64 truncate text-xs font-bold">{periodLabel || "No saved period"}</p></div>
        </div>
      </div>
    </header>
  );
}
