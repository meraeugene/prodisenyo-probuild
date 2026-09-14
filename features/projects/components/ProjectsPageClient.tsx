"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import CeoProjectsOverview from "./CeoProjectsOverview";
import EngineerProjectPortfolio from "./EngineerProjectPortfolio";
import { createProjectAction } from "@/actions/projects";
import { getProjectEntryHref } from "@/features/projects/utils/projectLifecycle";
import type { EngineerOption, ProjectRecord } from "../types";

type ProjectField =
  | "name"
  | "location"
  | "subject"
  | "lead"
  | "estimateEngineerId"
  | "image"
  | "budget"
  | "startDate"
  | "endDate";

type FormErrors = Partial<Record<ProjectField, string>>;

export default function ProjectsPageClient({
  role,
  projects,
  engineers,
}: {
  role: "ceo" | "engineer";
  fullName: string | null;
  projects: ProjectRecord[];
  engineers: EngineerOption[];
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [budgetValue, setBudgetValue] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const clearFieldError = (field: ProjectField) =>
    setFormErrors((current) => ({ ...current, [field]: undefined }));

  function clearProjectImage() {
    setImagePreviewUrl(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    clearFieldError("image");
  }

  function closeCreateModal() {
    setShowCreate(false);
    clearProjectImage();
  }

  function handleProjectImage(file?: File) {
    if (!file) {
      clearProjectImage();
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormErrors((current) => ({
        ...current,
        image: "Choose a JPG, PNG, or WebP image.",
      }));
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors((current) => ({
        ...current,
        image: "Project image must be 5 MB or smaller.",
      }));
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }
    clearFieldError("image");
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  function openProject(projectId: string) {
    const project = projects.find((entry) => entry.id === projectId);
    if (!project) return;
    router.push(getProjectEntryHref({ role, projectId, status: project.status }));
  }

  useEffect(() => {
    if (!showCreate) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowCreate(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showCreate]);

  useEffect(
    () => () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    },
    [imagePreviewUrl],
  );

  function submit(formData: FormData) {
    const values = {
      name: String(formData.get("name") || "").trim(),
      location: String(formData.get("location") || "").trim(),
      subject: String(formData.get("subject") || "").trim(),
      lead: String(formData.get("lead") || "").trim(),
      estimateEngineerId: String(formData.get("estimateEngineerId") || ""),
      budget: Number(budgetValue.replaceAll(",", "")),
      startDate: String(formData.get("startDate") || ""),
      endDate: String(formData.get("endDate") || ""),
    };
    const errors: FormErrors = {};

    if (!values.name) errors.name = "Project name is required.";
    if (!values.location) errors.location = "Location is required.";
    if (!values.subject) errors.subject = "Subject is required.";
    if (!values.lead) errors.lead = "Project lead is required.";
    if (!values.estimateEngineerId) {
      errors.estimateEngineerId = "Select a cost estimate engineer.";
    }
    if (!budgetValue || !Number.isFinite(values.budget) || values.budget <= 0) {
      errors.budget = "Enter a budget greater than zero.";
    }
    if (!values.startDate) errors.startDate = "Start date is required.";
    if (!values.endDate) errors.endDate = "End date is required.";
    if (
      values.startDate &&
      values.endDate &&
      values.endDate < values.startDate
    ) {
      errors.endDate = "End date cannot be before the start date.";
    }

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    startTransition(async () => {
      try {
        await createProjectAction(
          {
            ...values,
            engineerId: null,
            estimateEngineerId: values.estimateEngineerId || null,
          },
          formData,
        );
        toast.success("Pending project created and assigned for cost estimation.");
        closeCreateModal();
        setBudgetValue("");
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create project.",
        );
      }
    });
  }

  return (
    <div className="min-h-full space-y-4 bg-white p-4 sm:p-6 lg:p-8">
      {role === "ceo" ? (
        <CeoProjectsOverview
          projects={projects}
          onCreateProject={() => {
            setFormErrors({});
            setBudgetValue("");
            clearProjectImage();
            setShowCreate(true);
          }}
          onOpenProject={openProject}
        />
      ) : (
        <EngineerProjectPortfolio
          projects={projects}
          onOpenProject={openProject}
        />
      )}
      {showCreate && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen items-start justify-center overflow-y-auto overscroll-contain bg-slate-950/65 px-4 py-4 sm:px-6"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeCreateModal();
              }}
            >
              <form
                action={submit}
                noValidate
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-project-title"
                className="my-auto w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                      Construction workflow
                    </p>
                    <h2 id="create-project-title" className="mt-1 text-xl font-bold text-slate-950">
                      Create project
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                    aria-label="Close create project form"
                  >
                    <X size={21} />
                  </button>
                </div>

                <div className="grid gap-x-5 gap-y-3 px-5 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
                  <Field name="name" label="Project name" error={formErrors.name} onChange={() => clearFieldError("name")} />
                  <Field name="location" label="Location" error={formErrors.location} onChange={() => clearFieldError("location")} />
                  <Field name="subject" label="Subject" error={formErrors.subject} onChange={() => clearFieldError("subject")} />
                  <label className="text-sm font-semibold text-slate-700">
                    Project lead
                    <select
                      name="lead"
                      aria-invalid={Boolean(formErrors.lead)}
                      onChange={() => clearFieldError("lead")}
                      className={`mt-1 h-11 w-full rounded-xl border bg-white px-3 font-normal outline-none transition ${formErrors.lead ? "border-red-500 focus:border-red-600" : "border-slate-200 focus:border-teal-700"}`}
                    >
                      <option value="">Select project lead</option>
                      {engineers.map((engineer) => (
                        <option key={engineer.id} value={engineer.name}>
                          {engineer.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.lead ? (
                      <span className="mt-1 block text-xs font-medium text-red-600">
                        {formErrors.lead}
                      </span>
                    ) : null}
                  </label>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Project image <span className="font-normal text-slate-400">(optional)</span>
                    </p>
                    <label className={`relative mt-1 flex h-28 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed transition ${formErrors.image ? "border-red-500 bg-red-50/30" : "border-slate-300 bg-slate-50/50 hover:border-teal-500 hover:bg-teal-50/30"}`}>
                      <input
                        ref={imageInputRef}
                        name="projectImage"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(event) =>
                          handleProjectImage(event.target.files?.[0])
                        }
                      />
                      {imagePreviewUrl ? (
                        <>
                          <Image
                            src={imagePreviewUrl}
                            alt="Selected project preview"
                            fill
                            unoptimized
                            className="object-cover"
                          />
                          <span className="absolute inset-x-0 bottom-0 bg-slate-950/65 px-3 py-2 text-center text-xs font-semibold text-white">
                            Click to replace image
                          </span>
                        </>
                      ) : (
                        <span className="flex flex-col items-center gap-2 px-4 text-center">
                          <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-700">
                            <UploadCloud size={18} />
                          </span>
                          <span className="text-xs font-semibold text-slate-700">
                            Upload project image
                          </span>
                          <span className="text-[11px] text-slate-400">
                            JPG, PNG or WebP · Max 5 MB
                          </span>
                        </span>
                      )}
                    </label>
                    <div className="mt-1 flex min-h-5 items-center justify-between gap-3">
                      {formErrors.image ? (
                        <span className="text-xs font-medium text-red-600">
                          {formErrors.image}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          You can add this later.
                        </span>
                      )}
                      {imagePreviewUrl ? (
                        <button
                          type="button"
                          onClick={clearProjectImage}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <label className="text-sm font-semibold text-slate-700">
                    Cost estimate engineer / project manager
                    <select
                      name="estimateEngineerId"
                      aria-invalid={Boolean(formErrors.estimateEngineerId)}
                      onChange={() => clearFieldError("estimateEngineerId")}
                      className={`mt-1 h-11 w-full rounded-xl border bg-white px-3 outline-none transition ${
                        formErrors.estimateEngineerId
                          ? "border-red-500 focus:border-red-600"
                          : "border-slate-200 focus:border-teal-700"
                      }`}
                    >
                      <option value="">Select estimate engineer</option>
                      {engineers.map((engineer) => (
                        <option key={engineer.id} value={engineer.id}>
                          {engineer.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.estimateEngineerId ? (
                      <span className="mt-1 block text-xs font-medium text-red-600">
                        {formErrors.estimateEngineerId}
                      </span>
                    ) : null}
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Budget ceiling (PHP)
                    <input
                      name="budgetDisplay"
                      type="text"
                      inputMode="decimal"
                      value={budgetValue}
                      aria-invalid={Boolean(formErrors.budget)}
                      onChange={(event) => {
                        setBudgetValue(formatBudgetInput(event.target.value));
                        clearFieldError("budget");
                      }}
                      placeholder="0.00"
                      className={`mt-1 h-11 w-full rounded-xl border px-3 font-normal outline-none ${
                        formErrors.budget
                          ? "border-red-500 focus:border-red-600"
                          : "border-slate-200 focus:border-teal-700"
                      }`}
                    />
                    {formErrors.budget ? (
                      <span className="mt-1 block text-xs font-medium text-red-600">
                        {formErrors.budget}
                      </span>
                    ) : null}
                  </label>
                  <Field name="startDate" label="Start date" type="date" error={formErrors.startDate} onChange={() => clearFieldError("startDate")} />
                  <Field name="endDate" label="End date" type="date" error={formErrors.endDate} onChange={() => clearFieldError("endDate")} />
                </div>

                <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="h-11 rounded-xl border border-slate-300 px-5 text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={pending}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(7,109,105,0.18)] hover:bg-teal-900 disabled:opacity-60"
                  >
                    {pending ? <LoaderCircle className="animate-spin" size={16} /> : null}
                    Create project
                  </button>
                </div>
              </form>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  error,
  onChange,
}: {
  name: ProjectField;
  label: string;
  type?: string;
  error?: string;
  onChange?: () => void;
}) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        aria-invalid={Boolean(error)}
        onChange={onChange}
        className={`mt-1 h-11 w-full rounded-xl border px-3 font-normal outline-none transition ${
          error
            ? "border-red-500 focus:border-red-600"
            : "border-slate-200 focus:border-teal-700"
        }`}
      />
      {error ? (
        <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>
      ) : null}
    </label>
  );
}

function formatBudgetInput(value: string) {
  const normalized = value.replaceAll(",", "").replace(/[^\d.]/g, "");
  const [whole = "", ...decimalParts] = normalized.split(".");
  const decimal = decimalParts.join("").slice(0, 2);
  const formattedWhole = whole.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return normalized.includes(".") ? `${formattedWhole || "0"}.${decimal}` : formattedWhole;
}
