import { CheckCircle2, Clock3, ShoppingCart, Truck } from "lucide-react";
import type { CeoMaterialRequest } from "@/features/ceo-dashboard/types";

export default function CeoMaterialWorkflowPanel({
  requests,
}: {
  requests: CeoMaterialRequest[];
}) {
  const items = [
    {
      label: "Awaiting approval",
      count: requests.filter((request) => request.status === "submitted").length,
      icon: Clock3,
      accent: "bg-amber-50 text-amber-700",
    },
    {
      label: "Purchasing",
      count: requests.filter((request) => ["approved", "purchasing"].includes(request.status)).length,
      icon: ShoppingCart,
      accent: "bg-violet-50 text-violet-700",
    },
    {
      label: "Ordered",
      count: requests.filter((request) => request.status === "ordered").length,
      icon: Truck,
      accent: "bg-sky-50 text-sky-700",
    },
    {
      label: "Received",
      count: requests.filter((request) => request.status === "received").length,
      icon: CheckCircle2,
      accent: "bg-teal-50 text-teal-700",
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,.7)]">
      <div>
        <h2 className="font-bold text-slate-950">Materials flow</h2>
        <p className="mt-0.5 text-xs text-slate-500">Requests by current stage</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xl font-semibold text-slate-950">{item.count}</p>
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${item.accent}`}>
                  <Icon size={16} />
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">{item.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
