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

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        return (
          <article key={card.label} className="flex min-h-28 items-center gap-4 rounded-[22px] border border-white/80 bg-white/80 p-5 shadow-[0_14px_38px_rgba(15,23,42,.06)] backdrop-blur-xl">
            <div>
              <p className="text-sm font-semibold text-slate-700">{card.label}</p>
              <p className="mt-1 text-3xl font-bold tracking-[-0.04em] text-teal-700">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500">{card.helper}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
