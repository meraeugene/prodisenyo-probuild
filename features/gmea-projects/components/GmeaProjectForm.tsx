"use client";
import { useState } from "react";
import type {
  ContractPaymentTermInput,
  GmeaProject,
  ProjectDetailsInput,
} from "../types";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import { buildPaymentTerms, recalculatePercentageTerms } from "../utils/paymentTerms";
import GmeaDialog from "./GmeaDialog";
import { MoneyField, TextField } from "./GmeaFields";
import GmeaPaymentTermsEditor from "./GmeaPaymentTermsEditor";

export default function GmeaProjectForm({
  project,
  onClose,
}: {
  project?: GmeaProject;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ProjectDetailsInput>(
    project ? {
      name: project.name,
      client: project.client,
      location: project.location,
      duration: project.duration,
    } : {
      name: "",
      client: "",
      location: "",
      duration: "",
    },
  );
  const [contractAmount, setContractAmount] = useState(0);
  const [terms, setTerms] = useState<ContractPaymentTermInput[]>(() =>
    project ? [] : buildPaymentTerms("80-20", 0),
  );
  const save = useGmeaMutation(project);
  function update<K extends keyof ProjectDetailsInput>(
    key: K,
    value: ProjectDetailsInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  return (
    <GmeaDialog
      title={project ? "Edit project" : "New GMEA project"}
      description="Enter the contract details shown in the project monitoring workbook."
      onClose={onClose}
      onSave={() =>
        project
          ? save({ kind: "project_details", value: form })
          : save({
              kind: "create_project",
              value: {
                details: form,
                contract: {
                  contract_amount: contractAmount,
                  payment_terms: terms,
                },
              },
            })
      }
      wide={!project}
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
        <TextField
          label="Project duration *"
          required
          placeholder="e.g. 7 days"
          maxLength={100}
          value={form.duration}
          onChange={(e) => update("duration", e.target.value)}
        />
      </div>
      {!project && (
        <div className="space-y-4 border-t border-slate-200 pt-5">
          <MoneyField
            label="Contract amount (PHP) *"
            required
            value={contractAmount}
            onValueChange={(value) => {
              setContractAmount(value);
              setTerms((current) => recalculatePercentageTerms(current, value));
            }}
          />
          <GmeaPaymentTermsEditor
            contractAmount={contractAmount}
            terms={terms}
            onChange={setTerms}
          />
        </div>
      )}
    </GmeaDialog>
  );
}
