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
  ] as const;
  return <WorkspaceSummaryCards ariaLabel="Overview summary" cards={cards.map(([label, value]) => ({ label, value }))} className="xl:grid-cols-5" />;
}
