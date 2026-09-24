"use client";

import { useState } from "react";
import type { GmeaRental, RentalWorker } from "../types";
import { rentalInputClass } from "../utils/rentalUi";
import { useGmeaRentalOperationsMutation } from "../hooks/useGmeaRentalOperationsMutation";
import GmeaRentalsDialog from "./GmeaRentalsDialog";

export default function GmeaRentalAssignmentForm({
  rental,
  workers,
  onClose,
}: {
  rental: GmeaRental;
  workers: RentalWorker[];
  onClose: () => void;
}) {
  const [workerId, setWorkerId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const { saveAssignment, pending, error } =
    useGmeaRentalOperationsMutation(rental);
  function submit() {
    void saveAssignment({
      kind: "assign_worker",
      value: {
        id: crypto.randomUUID(),
        worker_id: workerId,
        equipment_id: equipmentId || null,
      },
    })
      .then(onClose)
      .catch(() => undefined);
  }
  return (
    <GmeaRentalsDialog
      title="Assign worker"
      description="Assign a driver or operator to the whole rental or one equipment unit."
      onClose={onClose}
      onSave={submit}
      pending={pending}
      error={error}
      saveLabel="Assign worker"
    >
      <div className="space-y-4">
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          <span>Worker *</span>
          <select
            value={workerId}
            onChange={(event) => setWorkerId(event.target.value)}
            className={rentalInputClass}
          >
            <option value="">Select an active worker</option>
            {workers
              .filter((worker) => worker.is_active)
              .map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name} — {worker.role}
                </option>
              ))}
          </select>
        </label>
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          <span>Assignment scope</span>
          <select
            value={equipmentId}
            onChange={(event) => setEquipmentId(event.target.value)}
            className={rentalInputClass}
          >
            <option value="">Entire rental</option>
            {rental.items.map((item) => (
              <option key={item.equipment_id} value={item.equipment_id}>
                {item.equipment_name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </GmeaRentalsDialog>
  );
}
