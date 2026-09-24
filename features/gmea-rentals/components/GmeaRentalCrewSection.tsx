"use client";

import { useState } from "react";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import type { GmeaRental, RentalWorker } from "../types";
import {
  rentalPrimaryButtonClass,
  rentalSecondaryButtonClass,
} from "../utils/rentalUi";
import { useGmeaRentalOperationsMutation } from "../hooks/useGmeaRentalOperationsMutation";
import GmeaRentalAssignmentForm from "./GmeaRentalAssignmentForm";
import GmeaRentalWorkerForm from "./GmeaRentalWorkerForm";

export default function GmeaRentalCrewSection({
  rental,
  workers,
  canEdit,
}: {
  rental: GmeaRental;
  workers: RentalWorker[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState<RentalWorker | null | undefined>();
  const [assigning, setAssigning] = useState(false);
  const { saveWorker, saveAssignment, pending, error } =
    useGmeaRentalOperationsMutation(rental);
  const workerById = new Map(workers.map((worker) => [worker.id, worker]));
  const equipmentById = new Map(
    rental.items.map((item) => [item.equipment_id, item.equipment_name]),
  );

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Drivers and operators
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Basic rental assignments only. No payroll calculations are included.
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className={rentalSecondaryButtonClass}
            >
              <Plus size={15} /> Add worker
            </button>
            <button
              type="button"
              onClick={() => setAssigning(true)}
              className={rentalPrimaryButtonClass}
            >
              <Plus size={15} /> Assign worker
            </button>
          </div>
        )}
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          Current rental assignments
        </h3>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          {rental.assignments.length ? (
            <div className="divide-y divide-slate-100">
              {rental.assignments.map((assignment) => {
                const worker = workerById.get(assignment.worker_id);
                return (
                  <article
                    key={assignment.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-950">
                        {worker?.name ?? "Unknown worker"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {worker?.role ?? "Worker"} ·{" "}
                        {assignment.equipment_id
                          ? (equipmentById.get(assignment.equipment_id) ??
                            "Equipment")
                          : "Entire rental"}
                      </p>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          void saveAssignment({
                            kind: "remove_assignment",
                            assignment_id: assignment.id,
                          }).catch(() => undefined)
                        }
                        className="inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 sm:self-auto"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-slate-500">
              No workers assigned to this rental.
            </p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          Worker directory
        </h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {workers.map((worker) => (
            <article
              key={worker.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{worker.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {worker.role}
                    {worker.phone ? " · " + worker.phone : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${worker.is_active ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {worker.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              {canEdit && (
                <div className="mt-3 flex justify-end gap-1 border-t border-slate-100 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(worker)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  {worker.is_active && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        void saveWorker(worker, { kind: "deactivate" }).catch(
                          () => undefined,
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      <Power size={14} /> Deactivate
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
          {!workers.length && (
            <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 md:col-span-2">
              No drivers or operators added.
            </p>
          )}
        </div>
      </div>

      {editing !== undefined && (
        <GmeaRentalWorkerForm
          rental={rental}
          worker={editing ?? undefined}
          onClose={() => setEditing(undefined)}
        />
      )}
      {assigning && (
        <GmeaRentalAssignmentForm
          rental={rental}
          workers={workers}
          onClose={() => setAssigning(false)}
        />
      )}
    </section>
  );
}
