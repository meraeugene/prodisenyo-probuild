"use client";
import { useState } from "react";
import type { GmeaProject, ProjectInput } from "../types";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import { formatMoney, money } from "../utils/gmeaCalculations";
import GmeaDialog from "./GmeaDialog";
import { MoneyField, TextField } from "./GmeaFields";

export default function GmeaProjectForm({
  project,
  onClose,
}: {
  project?: GmeaProject;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ProjectInput>(
    project ?? {
      name: "",
      client: "",
      location: "",
      contract_amount: 0,
      withholding_tax_rate: 0,
      duration: "",
      status: "planning",
    },
  );
  const save = useGmeaMutation(project);
  function update<K extends keyof ProjectInput>(
    key: K,
    value: ProjectInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  const withholding = money(
    (form.contract_amount * form.withholding_tax_rate) / 100,
  );
  const netContract = money(form.contract_amount - withholding);
  return (
    <GmeaDialog
      title={project ? "Edit project" : "New GMEA project"}
      description="Enter the contract details shown in the project monitoring workbook."
      onClose={onClose}
      onSave={() => save({ kind: "project", value: form })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Project name *"
          required
          maxLength={200}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
        <TextField
          label="Client"
          maxLength={200}
          value={form.client}
          onChange={(e) => update("client", e.target.value)}
        />
        <TextField
          label="Project location *"
          required
          maxLength={300}
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
        />
        <MoneyField
          label="Gross contract amount (PHP) *"
          required
          value={form.contract_amount}
          onValueChange={(value) => update("contract_amount", value)}
        />
        <TextField
          label="Withholding tax rate (%)"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={form.withholding_tax_rate || ""}
          onChange={(e) =>
            update("withholding_tax_rate", Number(e.target.value))
          }
        />
        <TextField
          label="Project duration *"
          required
          placeholder="e.g. 7 days"
          maxLength={100}
          value={form.duration}
          onChange={(e) => update("duration", e.target.value)}
        />
      </div>
      <div className="grid gap-3 rounded-xl bg-cyan-50 p-4 text-sm sm:grid-cols-2">
        <p>
          Withholding tax: <strong>{formatMoney(withholding)}</strong>
        </p>
        <p>
          Net contract amount: <strong>{formatMoney(netContract)}</strong>
        </p>
      </div>
    </GmeaDialog>
  );
}
