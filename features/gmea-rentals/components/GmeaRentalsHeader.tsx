import { Plus } from "lucide-react";
import {
  rentalPrimaryButtonClass,
  rentalSecondaryButtonClass,
} from "../utils/rentalUi";

export default function GmeaRentalsHeader({
  canEdit,
  onAddEquipment,
  onCreateRental,
}: {
  canEdit: boolean;
  onAddEquipment: () => void;
  onCreateRental: () => void;
}) {
  return (
    <header className="rounded-[22px] bg-[#075e5b] px-6 py-7 text-white shadow-[0_18px_45px_-32px_rgba(3,62,60,.7)] sm:px-8 lg:px-9">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/75">
            GMEA Marketing Corporation
          </p>
          <h1 className="mt-2.5 text-[34px] font-bold leading-none tracking-[-0.045em] sm:text-[42px]">
            GMEA Rentals
          </h1>
          <p className="mt-3 text-sm text-white/80 sm:text-[15px]">
            Manage rental schedules and equipment in one workspace.
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onAddEquipment}
              className={
                rentalSecondaryButtonClass +
                " border-white/40 bg-transparent text-white hover:bg-white/10"
              }
            >
              <Plus size={17} aria-hidden="true" />
              Add equipment
            </button>
            <button
              type="button"
              onClick={onCreateRental}
              className={
                rentalPrimaryButtonClass +
                " border border-white/70 bg-white text-[#076d69] hover:bg-teal-50"
              }
            >
              <Plus size={18} aria-hidden="true" />
              New rental
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
