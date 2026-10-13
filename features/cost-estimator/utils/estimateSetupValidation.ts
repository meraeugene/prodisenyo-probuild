import type { ProjectEstimateDraftForm } from "../types";

type SetupFormErrors = Partial<Record<"projectId" | "projectName" | "projectType" | "location" | "ownerName" | "costEstimate", string>>;

export function validateSetupForm(form: ProjectEstimateDraftForm) {
    const errors: SetupFormErrors = {};

    if (!form.projectId) {
      errors.projectId = "Select an assigned project.";
    }

    if (!form.projectName.trim()) {
      errors.projectName = "Project name is required.";
    }

    if (!form.projectType) {
      errors.projectType = "Project type is required.";
    }

    if (!form.location.trim()) {
      errors.location = "Location is required.";
    }

    if (!form.ownerName.trim()) {
      errors.ownerName = "Owner is required.";
    }

    if (Math.round(form.costEstimate * 100) / 100 <= 0) {
      errors.costEstimate = "Cost estimate must be greater than zero.";
    }

    return errors;
  }

