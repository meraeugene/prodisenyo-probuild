"use client";
import { useState } from "react";
import type { GmeaProject } from "../types";
import { secondaryClass } from "../utils/gmeaConstants";
import { sumMoney } from "../utils/gmeaCalculations";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaDialog from "./GmeaDialog";
import { TextField } from "./GmeaFields";
export default function GmeaAllocationForm({
  project,
  kind,
  onClose,
}: {
  project: GmeaProject;
  kind: "partners" | "milestones";
  onClose: () => void;
}) {
  const [rows, setRows] = useState(() =>
    kind === "partners"
      ? project.partners.map((p) => ({ ...p }))
      : project.milestones.map((m) => ({
          id: m.id,
          name: m.label,
          percentage: m.percentage,
        })),
  );
  const save = useGmeaMutation(project);
  let total: number | null = null;
  try { total = sumMoney(rows.map(r => r.percentage)); } catch { /* Keep invalid input editable. */ }
  return (
    <GmeaDialog
      title={
        kind === "partners" ? "Profit sharing partners" : "Payment milestones"
      }
      description="Percentages must total 100%. Milestones with receipts cannot be removed."
      onClose={onClose}
      onSave={() =>
        kind === "partners"
          ? save({ kind, value: rows })
          : save({
              kind,
              value: rows.map((r) => ({
                id: r.id,
                label: r.name,
                percentage: r.percentage,
              })),
            })
      }
    >
      {rows.map((row, i) => (
        <div
          key={row.id}
          className="grid items-end gap-3 sm:grid-cols-[1fr_140px_auto]"
        >
          <TextField
            label={kind === "partners" ? "Partner name" : "Milestone label"}
            required
            value={row.name}
            maxLength={200}
            onChange={(e) =>
              setRows(
                rows.map((r, n) =>
                  n === i ? { ...r, name: e.target.value } : r,
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
            onChange={(e) =>
              setRows(
                rows.map((r, n) =>
                  n === i ? { ...r, percentage: Number(e.target.value) } : r,
                ),
              )
            }
          />
          <button
            type="button"
            className={secondaryClass + " text-rose-700"}
            onClick={() => setRows(rows.filter((_, n) => n !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className={secondaryClass}
          onClick={() =>
            setRows([
              ...rows,
              { id: crypto.randomUUID(), name: "", percentage: 0 },
            ])
          }
        >
          + Add {kind === "partners" ? "partner" : "milestone"}
        </button>
        <strong className="text-sm">
          Total: {total ?? "Invalid"}%
        </strong>
      </div>
    </GmeaDialog>
  );
}
