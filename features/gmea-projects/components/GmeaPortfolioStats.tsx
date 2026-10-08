import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import { formatMoney } from "../utils/gmeaCalculations";

export default function GmeaPortfolioStats({
  projectCount,
  contractTotal,
  expenseTotal,
}: {
  projectCount: number;
  contractTotal: number;
  expenseTotal: number;
}) {
  const stats = [
    {
      label: "Ongoing projects",
      value: String(projectCount),
    },
    {
      label: "Contract amount",
      value: formatMoney(contractTotal),
    },
    {
      label: "Total expenses",
      value: formatMoney(expenseTotal),
    },
  ];

  return <WorkspaceSummaryCards ariaLabel="Portfolio summary" className="sm:grid-cols-3" cards={stats} />;
}
