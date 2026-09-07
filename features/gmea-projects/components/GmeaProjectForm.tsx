"use client";
import { useState } from "react";
import type { GmeaProject, ProjectInput } from "../types";
import { PROJECT_STATUSES, inputClass } from "../utils/gmeaConstants";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaDialog from "./GmeaDialog";
import { Field, TextField } from "./GmeaFields";

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
      description: "",
      start_date: null,
      end_date: null,
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
  return (
    <GmeaDialog
      title={project ? "Edit project" : "New GMEA project"}
      description="Add the project details, then prepare its quotation."
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
          label="Location *"
          required
          maxLength={300}
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
        />
        <TextField
          label="Duration notes"
          placeholder="e.g. 7–14 days"
          maxLength={100}
          value={form.duration}
          onChange={(e) => update("duration", e.target.value)}
        />
        <TextField
          label="Start date"
          type="date"
          value={form.start_date ?? ""}
          onChange={(e) => update("start_date", e.target.value || null)}
        />
        <TextField
          label="End date"
          type="date"
          min={form.start_date ?? undefined}
          value={form.end_date ?? ""}
          onChange={(e) => update("end_date", e.target.value || null)}
        />
        <Field label="Status">
          <select
            className={inputClass}
            value={form.status}
            onChange={(e) =>
              update("status", e.target.value as ProjectInput["status"])
            }
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Description">
        <textarea
          className={inputClass}
          rows={3}
          maxLength={2000}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </Field>
    </GmeaDialog>
  );
}
