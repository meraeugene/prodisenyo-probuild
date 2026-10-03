import type { GmeaOverviewDivisionFinance } from "../types";
import FinancialSnapshotChart from "./FinancialSnapshotChart";
import ProfitBreakdownChart from "./ProfitBreakdownChart";

export default function GmeaOverviewFinance({ divisions }: { divisions: GmeaOverviewDivisionFinance[] }) {
  return (
    <section aria-label="Division finances" className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <FinancialSnapshotChart divisions={divisions} />
      <ProfitBreakdownChart divisions={divisions} />
    </section>
  );
}
