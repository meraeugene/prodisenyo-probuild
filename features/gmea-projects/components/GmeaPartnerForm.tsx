"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { GmeaProject } from "../types";
import { secondaryClass } from "../utils/gmeaConstants";
import { sumMoney } from "../utils/gmeaCalculations";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaDialog from "./GmeaDialog";
import { TextField } from "./GmeaFields";

export default function GmeaPartnerForm({
  project,
  onClose,
}: {
  project: GmeaProject;
  onClose: () => void;
}) {
  const [rows, setRows] = useState(() =>
    project.partners.map((partner) => ({ ...partner })),
  );
  const save = useGmeaMutation(project);
  let total: number | null = null;
  try {
    total = sumMoney(rows.map((row) => row.percentage));
  } catch {
    // Keep invalid input editable until the user saves.
  }
  return (
    <GmeaDialog
      title="Profit sharing partners"
      description="Percentages must total 100%."
      onClose={onClose}
      onSave={() => save({ kind: "partners", value: rows })}
    >
      {rows.map((row, index) => (
        <div
          key={row.id}
          className="grid items-end gap-3 sm:grid-cols-[1fr_140px_auto]"
        >
          <TextField
            label="Partner name"
            required
            value={row.name}
            maxLength={200}
            onChange={(event) =>
              setRows(
                rows.map((item, itemIndex) =>
                  itemIndex === index
                    ? { ...item, name: event.target.value }
                    : item,
                ),
              )
            }
          />
          <TextField
            label="Share (%)"
            required
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={row.percentage}
            onChange={(event) =>
              setRows(
                rows.map((item, itemIndex) =>
                  itemIndex === index
                    ? { ...item, percentage: Number(event.target.value) }
                    : item,
                ),
              )
            }
          />
          <button
            type="button"
            className={secondaryClass + " gap-2 text-rose-700"}
            onClick={() =>
              setRows(rows.filter((_, itemIndex) => itemIndex !== index))
            }
          >
            <Trash2 size={15} aria-hidden="true" /> Remove
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className={secondaryClass + " gap-2"}
          onClick={() =>
            setRows([
              ...rows,
              { id: crypto.randomUUID(), name: "", percentage: 0 },
            ])
          }
        >
          <Plus size={15} aria-hidden="true" /> Add partner
        </button>
        <strong className="text-sm">Total: {total ?? "Invalid"}%</strong>
      </div>
    </GmeaDialog>
  );
}
