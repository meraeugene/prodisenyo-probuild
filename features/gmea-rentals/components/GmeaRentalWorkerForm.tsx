"use client";
import { withGmeaEntrySession } from "@/features/gmea-forms/components/GmeaEntrySession";

import { useState } from "react";
import {
  RENTAL_WORKER_ROLES,
  type GmeaRental,
  type RentalWorker,
} from "../types";
import { rentalInputClass } from "../utils/rentalUi";
import { useGmeaRentalOperationsMutation } from "../hooks/useGmeaRentalOperationsMutation";
import OptionalFieldIndicator from "@/components/workspace/OptionalFieldIndicator";
import GmeaRentalsDialog from "./GmeaRentalsDialog";

function GmeaRentalWorkerForm({
  rental,
  worker,
  onClose,
}: {
  rental: GmeaRental;
  worker?: RentalWorker;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: worker?.name ?? "",
    role: worker?.role ?? "Driver",
    phone: worker?.phone ?? "",
    is_active: worker?.is_active ?? true,
  });
  const { saveWorker, pending, error } =
    useGmeaRentalOperationsMutation(rental);
  function submit() {
    void saveWorker(worker ?? null, {
      kind: worker ? "update" : "create",
      value: form,
    })
      .then(onClose)
      .catch(() => undefined);
  }
  return (
    <GmeaRentalsDialog
      title={worker ? "Edit worker" : "Add driver or operator"}
      description="Basic contact and assignment information. Payroll is not included."
      onClose={onClose}
      onSave={submit}
      pending={pending}
      error={error}
      saveLabel={worker ? "Save changes" : "Add worker"}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
          <span>Name *</span>
          <input
            required
            maxLength={200}
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            className={rentalInputClass}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Role *</span>
          <select
            required
            value={form.role}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                role: event.target.value as typeof current.role,
              }))
            }
            className={rentalInputClass}
          >
            {RENTAL_WORKER_ROLES.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Phone<OptionalFieldIndicator /></span>
          <input
            aria-label="Phone"
            type="tel"
            maxLength={50}
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
            className={rentalInputClass}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                is_active: event.target.checked,
              }))
            }
            className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
          />
          Active worker<OptionalFieldIndicator />
        </label>
      </div>
    </GmeaRentalsDialog>
  );
}

export default withGmeaEntrySession(GmeaRentalWorkerForm, ["worker"]);
