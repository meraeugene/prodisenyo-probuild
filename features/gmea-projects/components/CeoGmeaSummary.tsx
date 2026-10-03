"use client";

import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import { formatMoney } from "../utils/gmeaCalculations";
import type { buildCeoPortfolio } from "../utils/ceoPortfolio";

type PortfolioTrend = ReturnType<typeof buildCeoPortfolio>["trend"];

export default function CeoGmeaSummary({ count, contract, expenses, outstanding }: {
  count: number;
  contract: number;
  expenses: number;
  outstanding: number;
  trend: PortfolioTrend;
}) {
  const expensePercent = contract > 0 ? Math.round((expenses / contract) * 100) : 0;
  const outstandingPercent = contract > 0 ? Math.round((outstanding / contract) * 100) : 0;
  const entries = [
    { label: "Projects", value: String(count), note: "Current portfolio" },
    { label: "Contract Amount", value: formatMoney(contract), note: "Total portfolio value" },
    { label: "Total Expenses", value: formatMoney(expenses), note: `${expensePercent}% of contract value` },
    { label: "Outstanding Collections", value: formatMoney(outstanding), note: `${outstandingPercent}% of contract value` },
  ];

  return <WorkspaceSummaryCards ariaLabel="GMEA portfolio summary" cards={entries.map(({ label, value, note }) => ({ label, value, hint: note }))} />;
}
