import type {
  BudgetItemCategory,
  BudgetItemStatus,
  BudgetProjectType,
  Database,
} from "@/types/database";

export type BudgetProjectRow =
  Database["public"]["Tables"]["budget_projects"]["Row"];
export type BudgetItemRow = Database["public"]["Tables"]["budget_items"]["Row"];

export interface BudgetProjectFormInput {
  name: string;
  projectType: BudgetProjectType | "";
  currencyCode: string;
  startingBudget: number;
}

export interface BudgetItemFormInput {
  id?: string;
  projectId: string;
  name: string;
  status: BudgetItemStatus;
  category: BudgetItemCategory;
  estimatedCost: number;
  actualSpent: number;
  notes: string;
  sortOrder?: number;
}

export interface BudgetItemGroup {
  value: BudgetItemStatus;
  label: string;
  dotClassName: string;
  items: BudgetItemRow[];
}

export interface BudgetCategoryTotal {
  value: BudgetItemCategory;
  label: string;
  total: number;
  ratio: number;
}

export interface BudgetTrackerSummary {
  startingBudget: number;
  actualSpent: number;
  remainingBudget: number;
  categoryTotals: BudgetCategoryTotal[];
}

export const BUDGET_PROJECT_TYPE_OPTIONS: Array<{
  value: BudgetProjectType;
  label: string;
}> = [
  { value: "new_build", label: "New build" },
  { value: "renovation", label: "Renovation" },
  { value: "extension", label: "Extension" },
  { value: "other", label: "Other" },
];

export const BUDGET_ITEM_STATUS_OPTIONS: Array<{
  value: BudgetItemStatus;
  label: string;
  dotClassName: string;
}> = [
  { value: "upcoming", label: "Upcoming", dotClassName: "bg-rose-500" },
  { value: "ongoing", label: "Ongoing", dotClassName: "bg-amber-500" },
  { value: "completed", label: "Completed", dotClassName: "bg-emerald-500" },
];

export const BUDGET_ITEM_CATEGORY_OPTIONS: Array<{
  value: BudgetItemCategory;
  label: string;
}> = [
  { value: "materials", label: "Materials" },
  { value: "labor", label: "Labor" },
  { value: "equipment", label: "Equipment" },
  { value: "permits", label: "Permits" },
  { value: "services", label: "Services" },
  { value: "utilities", label: "Utilities" },
  { value: "transportation", label: "Transportation" },
  { value: "miscellaneous", label: "Miscellaneous" },
];
