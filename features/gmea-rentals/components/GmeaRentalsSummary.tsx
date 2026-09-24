import { CalendarRange, CircleCheck, Truck } from "lucide-react";
import type { GmeaRental, RentalEquipment } from "../types";

export default function GmeaRentalsSummary({
  rentals,
  equipment,
}: {
  rentals: GmeaRental[];
  equipment: RentalEquipment[];
}) {
  const entries = [
    {
      label: "Rentals",
      value: rentals.length,
      icon: CalendarRange,
      tone: "text-[#087d76]",
    },
    {
      label: "Active rentals",
      value: rentals.filter((rental) => rental.status === "active").length,
      icon: CircleCheck,
      tone: "text-[#1484c7]",
    },
    {
      label: "Active equipment",
      value: equipment.filter((item) => item.is_active).length,
      icon: Truck,
      tone: "text-[#dc8506]",
    },
  ];

  return (
    <section
      aria-label="Rentals summary"
      className="grid gap-3.5 sm:grid-cols-3"
    >
      {entries.map(({ label, value, icon: Icon, tone }) => (
        <article
          key={label}
          className="min-w-0 rounded-[12px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)] sm:min-h-[84px]"
        >
          <div className="flex items-center gap-2">
            <Icon size={13} className={tone} aria-hidden="true" />
            <p className="truncate text-xs font-semibold text-slate-700">
              {label}
            </p>
          </div>
          <p className="mt-2 text-[23px] font-semibold tracking-[-0.035em] text-slate-950 tabular-nums">
            {value}
          </p>
        </article>
      ))}
    </section>
  );
}
