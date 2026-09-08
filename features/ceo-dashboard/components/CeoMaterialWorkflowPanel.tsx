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
    },
    {
      label: "Purchasing",
      count: requests.filter((request) => ["approved", "purchasing"].includes(request.status)).length,
      icon: ShoppingCart,
    },
    {
      label: "Ordered",
      count: requests.filter((request) => request.status === "ordered").length,
      icon: Truck,
    },
    {
      label: "Received",
      count: requests.filter((request) => request.status === "received").length,
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <h2 className="font-bold text-slate-950">Materials Workflow</h2>
        <p className="mt-0.5 text-xs text-slate-500">Current persisted request status</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xl font-semibold text-slate-950">{item.count}</p>
                <Icon size={16} className="text-teal-700" />
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">{item.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
