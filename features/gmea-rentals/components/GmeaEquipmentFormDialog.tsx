"use client";

import { EQUIPMENT_STATUSES, RATE_UNITS, type RentalEquipment } from "../types";
import { rentalInputClass, rentalLabel } from "../utils/rentalUi";
import GmeaRentalsDialog from "./GmeaRentalsDialog";

export type EquipmentFormState = {
  code: string;
  name: string;
  equipment_type: string;
  plate_number: string;
  default_rate: string;
  rate_unit: string;
  notes: string;
  status: string;
  is_active: boolean;
};

export const blankEquipmentForm = (): EquipmentFormState => ({
  code: "",
  name: "",
  equipment_type: "",
  plate_number: "",
  default_rate: "",
  rate_unit: "",
  notes: "",
  status: "available",
  is_active: true,
});

export default function GmeaEquipmentFormDialog({
  equipment,
  form,
  onChange,
  onClose,
  onSave,
  pending,
  error,
}: {
  equipment: RentalEquipment | null;
  form: EquipmentFormState;
  onChange: <K extends keyof EquipmentFormState>(
    key: K,
    value: EquipmentFormState[K],
  ) => void;
  onClose: () => void;
  onSave: () => void;
  pending: boolean;
  error: string;
}) {
  const fields = [
    ["name", "Name *"],
    ["equipment_type", "Type *"],
    ["code", "Asset code *"],
    ["plate_number", "Plate number"],
    ["default_rate", "Default rate"],
  ] as const;

  return (
    <GmeaRentalsDialog
      title={equipment ? "Edit equipment" : "Add equipment"}
      description="Equipment details, default billing rate, and availability."
      onClose={onClose}
      onSave={onSave}
      pending={pending}
      error={error}
      saveLabel={equipment ? "Save changes" : "Add equipment"}
    >
      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        {fields.map(([key, label]) => (
          <label
            key={key}
            className="space-y-1.5 text-sm font-medium text-slate-700"
          >
            <span className="block">{label}</span>
            <input
              type={key === "default_rate" ? "number" : "text"}
              min={key === "default_rate" ? "0" : undefined}
              value={form[key]}
              onChange={(event) => onChange(key, event.target.value)}
              className={rentalInputClass}
            />
          </label>
        ))}
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span className="block">Default rate type</span>
          <select
            value={form.rate_unit}
            onChange={(event) => onChange("rate_unit", event.target.value)}
            className={rentalInputClass}
          >
            <option value="">Not set</option>
            {RATE_UNITS.map((value) => (
              <option key={value} value={value}>
                {rentalLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span className="block">Status</span>
          <select
            value={form.status}
            onChange={(event) => {
              onChange("status", event.target.value);
              if (event.target.value === "inactive")
                onChange("is_active", false);
            }}
            className={rentalInputClass}
          >
            {EQUIPMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {rentalLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
          <span className="block">Notes</span>
          <textarea
            value={form.notes}
            onChange={(event) => onChange("notes", event.target.value)}
            className={rentalInputClass + " min-h-24 py-3"}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={form.is_active}
            disabled={form.status === "inactive"}
            onChange={(event) => onChange("is_active", event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
          />
          Active equipment
        </label>
      </fieldset>
    </GmeaRentalsDialog>
  );
}
