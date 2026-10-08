import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import { formatOverviewMoney } from "../utils/gmeaOverviewSelectors";

export default function GmeaOverviewSummary({
  summary,
}: {
  summary: {
    activeWork: number;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    activeClients: number;
    totalCollected: number;
    notCollected: number;
  };
}) {
  const cards = [
    [
      "Active projects / rentals",
      summary.activeWork,
    ],
    [
      "Total revenue",
      formatOverviewMoney(summary.totalRevenue),
    ],
    [
      "Total expenses",
      formatOverviewMoney(summary.totalExpenses),
    ],
    [
      "Net profit / loss",
      formatOverviewMoney(summary.netProfit),
    ],
    ["Active clients", summary.activeClients],
    ["Total collected", formatOverviewMoney(summary.totalCollected)],
    ["Not collected", formatOverviewMoney(summary.notCollected)],
  ] as const;
  return <WorkspaceSummaryCards ariaLabel="Overview summary" cards={cards.map(([label, value]) => ({ label, value }))} className="xl:grid-cols-4" />;
}
