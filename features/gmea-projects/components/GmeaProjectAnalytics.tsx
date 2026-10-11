"use client";

import type { buildCeoPortfolio } from "../utils/ceoPortfolio";
import CeoGmeaCharts from "./CeoGmeaCharts";

export default function GmeaProjectAnalytics({ data, months, onMonthsChange }: {
  data: ReturnType<typeof buildCeoPortfolio>;
  months: number;
  onMonthsChange: (months: number) => void;
}) {
  return <section aria-label="GMEA project analytics" className="space-y-4">
    <header><h2 className="text-lg font-semibold">Project analytics</h2>
      <p className="mt-1 text-sm text-slate-500">Contract and expense trends and collection status across all projects, including completed work.</p></header>
    <CeoGmeaCharts data={data} months={months} onMonthsChange={onMonthsChange} />
  </section>;
}
