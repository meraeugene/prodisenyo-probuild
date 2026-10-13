"use client";
import DashboardPageHero from "@/components/DashboardPageHero";
import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import type { GmeaDashboardData } from "../types";
import { useGmeaDashboard } from "../hooks/useGmeaDashboard";
import { formatRentalMoney } from "@/features/gmea-rentals/utils/rentalUi";
import GmeaDashboardBreakdown from "./GmeaDashboardBreakdown";
import GmeaDashboardCharts from "./GmeaDashboardCharts";

export default function GmeaDashboardPageClient({ initialData }: { initialData: GmeaDashboardData }) {
  const state = useGmeaDashboard(initialData), s = state.summary;
  return <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8"><div className="mx-auto max-w-[1440px] space-y-4">
    <DashboardPageHero eyebrow="GMEA" title="Dashboard" description="Overall collections, expenses, and balances across rentals, operations, and projects." />
    {state.error && <p role="alert" className="rounded bg-rose-50 p-3 text-sm text-rose-700">Live updates are temporarily unavailable. Retrying automatically.</p>}
    <WorkspaceSummaryCards ariaLabel="Overall GMEA financial totals" cards={[
      { label: "Total collected income", value: formatRentalMoney(s.collected), hint: "Rental receipts plus project collections" },
      { label: "Total expenses", value: formatRentalMoney(s.expenses), hint: "Rental, operation, and project expenses" },
      { label: "Net after expenses", value: formatRentalMoney(s.net), hint: "Collected income minus total expenses" },
      { label: "Not collected", value: formatRentalMoney(s.outstanding), hint: "Confirmed rental and project balances" },
    ]} />
    <GmeaDashboardBreakdown summary={s} />
    <WorkspaceSummaryCards ariaLabel="GMEA activity totals" className="xl:grid-cols-4" cards={[
      { label: "Ongoing projects", value: s.activeProjects }, { label: "Completed projects", value: s.completedProjects },
      { label: "Rental records", value: s.rentalCount }, { label: "Rental locations", value: s.locationCount },
    ]} />
    <GmeaDashboardCharts trend={state.trend} />
    <p className="text-xs text-slate-500">Totals recalculate from saved records and refresh automatically. The chart uses transaction dates; receipts without dates remain included in overall totals.</p>
  </div></main>;
}
