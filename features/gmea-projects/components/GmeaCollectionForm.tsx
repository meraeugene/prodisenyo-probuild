"use client";

import { useState } from "react";
import type { ContractCollection, GmeaProject } from "../types";
import { money } from "../utils/gmeaCalculations";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaDialog from "./GmeaDialog";
import { MoneyField, TextField } from "./GmeaFields";

const DOWN_PAYMENT = "Down payment of the contract 80%";
const COMPLETION = "Completion and final turn over 20%";

function createRow(
  project: GmeaProject,
  description: string,
  percentage: number,
) {
  const saved = project.collections.find(
    (collection) => collection.description === description,
  );
  return (
    saved ?? {
      id: crypto.randomUUID(),
      description,
      amount: money(project.contract_amount * percentage),
      notes: "",
    }
  );
}

export default function GmeaCollectionForm({
  project,
  readOnly = false,
  onClose,
}: {
  project: GmeaProject;
  readOnly?: boolean;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<ContractCollection[]>(() => [
    createRow(project, DOWN_PAYMENT, 0.8),
    createRow(project, COMPLETION, 0.2),
  ]);
  const save = useGmeaMutation(project);

  function update(
    index: number,
    key: "amount" | "notes",
    value: number | string,
  ) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
  }

  return (
    <GmeaDialog
      title={readOnly ? "Collection schedule" : "Edit collection schedule"}
      onClose={onClose}
      onSave={
        readOnly ? undefined : () => save({ kind: "collections", value: rows })
      }
    >
      <fieldset disabled={readOnly} className="space-y-5">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          >
            <MoneyField
              label={row.description}
              required
              value={row.amount}
              onValueChange={(value) => update(index, "amount", value)}
            />
            <TextField
              label="Notes"
              maxLength={1000}
              value={row.notes}
              onChange={(event) => update(index, "notes", event.target.value)}
            />
          </div>
        ))}
      </fieldset>
    </GmeaDialog>
  );
}
