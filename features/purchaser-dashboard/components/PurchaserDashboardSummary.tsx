import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import type { PurchaserDashboardSummary as Summary } from "@/features/purchaser-dashboard/types";

export default function PurchaserDashboardSummary({ summary }: { summary: Summary }) {
  const cards = [
    {
      label: "Approved Requests",
      value: summary.approvedRequests,
      helper: "Available purchase records",
    },
    {
      label: "Need Supplier Pricing",
      value: summary.needPricing,
      helper: "Supplier or actual cost missing",
    },
    {
      label: "Active Purchase Orders",
      value: summary.activeOrders,
      helper: "Not received or cancelled",
    },
    {
      label: "Delivery Updates",
      value: summary.deliveriesAwaitingUpdate,
      helper: "Ordered and not delivered",
    },
  ];

  return <WorkspaceSummaryCards ariaLabel="Purchasing summary" cards={cards.map(card => ({ ...card, hint: card.helper }))} className="xl:grid-cols-4" />;
}
