import type { EquipmentStatus, RentalStatus } from "../types";
import { rentalLabel } from "../utils/rentalUi";

const tones: Record<EquipmentStatus | RentalStatus, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  reserved: "border-amber-200 bg-amber-50 text-amber-700",
  on_rental: "border-sky-200 bg-sky-50 text-sky-700",
  maintenance: "border-orange-200 bg-orange-50 text-orange-700",
  inactive: "border-slate-200 bg-slate-100 text-slate-600",
  draft: "border-slate-200 bg-slate-100 text-slate-600",
  active: "border-teal-200 bg-teal-50 text-teal-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function RentalStatusBadge({
  status,
}: {
  status: EquipmentStatus | RentalStatus;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[status]}`}
    >
      {rentalLabel(status)}
    </span>
  );
}
