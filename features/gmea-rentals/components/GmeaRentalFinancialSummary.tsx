import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import type { RentalPortfolioSummary } from "../utils/rentalPortfolioSelectors";
import { formatRentalMoney } from "../utils/rentalUi";

export default function GmeaRentalFinancialSummary({ summary, label }: { summary: RentalPortfolioSummary; label: string }) {
  return <WorkspaceSummaryCards ariaLabel={label} className="xl:grid-cols-3" cards={[
      { label: "Total down payment", value: formatRentalMoney(summary.downPayment), hint: "Posted down payments across all dates" },
      { label: "Total payment", value: formatRentalMoney(summary.fullPayment), hint: "Posted full and final payments" },
      { label: "Not collected", value: formatRentalMoney(summary.outstanding), hint: "Remaining confirmed rental balances" },
      { label: "Total collected", value: formatRentalMoney(summary.collected), hint: "Down payments, final payments, and other receipts" },
      { label: "Total rental amount", value: formatRentalMoney(summary.charge), hint: "Confirmed charges, excluding drafts and cancellations" },
      { label: "Total expenses", value: formatRentalMoney(summary.expenses), hint: "Including VAT, less refunds, across all dates" },
    ]} />;
}
