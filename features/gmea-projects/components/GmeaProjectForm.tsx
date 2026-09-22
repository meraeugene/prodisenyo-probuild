"use client";
import { useState } from "react";
import type {
  ContractPaymentTermInput,
  GmeaProject,
  ProjectDetailsInput,
} from "../types";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import { buildPaymentTerms, recalculatePercentageTerms } from "../utils/paymentTerms";
import {
  DEFAULT_PROJECT_COLOR,
  workbookColorForProjectTitle,
} from "../utils/projectAppearance";
import GmeaDialog from "./GmeaDialog";
import { MoneyField, TextField } from "./GmeaFields";
import GmeaPaymentTermsEditor from "./GmeaPaymentTermsEditor";
import GmeaProjectColorField from "./GmeaProjectColorField";

export default function GmeaProjectForm({
  project,
  onClose,
}: {
  project?: GmeaProject;
  onClose: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<ProjectDetailsInput>(
    project ? {
      title: project.title ?? project.name ?? "",
      name: project.name ?? "",
      color: project.color ?? DEFAULT_PROJECT_COLOR,
      client: project.client ?? "",
      location: project.location ?? "",
      duration: project.duration ?? "",
    } : {
      title: "",
      name: "",
      color: DEFAULT_PROJECT_COLOR,
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
      description={project
        ? "Update the project information."
        : step === 1
          ? "Step 1 of 2 · Project details"
          : "Step 2 of 2 · Contract and payment schedule"}
      onClose={onClose}
      onAdvance={!project && step === 1 ? () => setStep(2) : undefined}
      onSave={project || step === 2 ? () =>
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
        : undefined}
      saveLabel={project ? "Save changes" : step === 1 ? "Continue" : "Create project"}
      secondaryLabel={!project && step === 2 ? "Back" : "Cancel"}
      onSecondary={!project && step === 2 ? () => setStep(1) : undefined}
      wide={!project}
    >
      {(project || step === 1) && (
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Project title *"
          required
          placeholder="e.g. MARAMAG"
          maxLength={100}
          value={form.title}
          onChange={(event) => {
            const title = event.target.value;
            const workbookColor = workbookColorForProjectTitle(title);
            setForm((current) => ({
              ...current,
              title,
              color: workbookColor ?? current.color,
            }));
          }}
        />
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
        <div className="md:col-span-2">
          <GmeaProjectColorField
            value={form.color}
            onChange={(color) => update("color", color)}
          />
        </div>
      </div>
      )}
      {!project && step === 2 && (
        <div className="space-y-5">
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
