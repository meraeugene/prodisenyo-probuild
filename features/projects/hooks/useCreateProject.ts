"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProjectAction } from "@/actions/projects";
import type { ProjectField, FormErrors } from "../types";
export function useCreateProject() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [budgetValue, setBudgetValue] = useState("");
  const [pending, startTransition] = useTransition();
  const clearFieldError = (field: ProjectField) =>
    setFormErrors((current) => ({ ...current, [field]: undefined }));

  function closeCreateModal() {
    setShowCreate(false);
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
  function openCreateModal() { setFormErrors({}); setBudgetValue(""); setShowCreate(true); }
  return { showCreate, formErrors, budgetValue, setBudgetValue, pending, clearFieldError, closeCreateModal, submit, openCreateModal };
}
