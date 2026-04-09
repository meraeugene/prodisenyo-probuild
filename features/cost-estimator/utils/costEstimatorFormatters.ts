import {
  formatBudgetMoney,
  formatBudgetNumberForInput,
  parseBudgetNumberInput,
  sanitizeBudgetNumericInput,
  getBudgetCategoryLabel,
} from "@/features/budget-tracker/utils/budgetTrackerFormatters";
import { ESTIMATE_STATUS_OPTIONS } from "@/features/cost-estimator/types";
import type {
  BudgetProjectType,
  EstimateStatus,
} from "@/types/database";
import { BUDGET_PROJECT_TYPE_OPTIONS } from "@/features/budget-tracker/types";

export {
  formatBudgetMoney,
  formatBudgetNumberForInput,
  parseBudgetNumberInput,
  sanitizeBudgetNumericInput,
  getBudgetCategoryLabel,
};

export function formatEstimateStatusLabel(status: EstimateStatus) {
  return (
    ESTIMATE_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  );
}

export function getEstimateStatusBadgeClass(status: EstimateStatus) {
  switch (status) {
    case "submitted":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "draft":
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function formatProjectTypeLabel(value: BudgetProjectType | null) {
  return (
    BUDGET_PROJECT_TYPE_OPTIONS.find((option) => option.value === value)
      ?.label ?? "Not set"
  );
}

export function formatEstimateDateTime(value: string | null) {
  if (!value) return "Not yet submitted";

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
