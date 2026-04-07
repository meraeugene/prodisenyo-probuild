"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type DragEvent,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, FolderPlus, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  createBudgetProjectAction,
  deleteBudgetItemAction,
  deleteBudgetProjectAction,
  saveBudgetItemAction,
} from "@/actions/budgetTracker";
import {
  BUDGET_ITEM_CATEGORY_OPTIONS,
  BUDGET_ITEM_STATUS_OPTIONS,
  BUDGET_PROJECT_TYPE_OPTIONS,
  type BudgetItemFormInput,
  type BudgetItemRow,
  type BudgetProjectFormInput,
  type BudgetProjectRow,
} from "@/features/budget-tracker/types";
import { cn } from "@/lib/utils";
import type {
  BudgetItemCategory,
  BudgetItemStatus,
  BudgetProjectType,
} from "@/types/database";

const EMPTY_PROJECT_FORM: BudgetProjectFormInput = {
  name: "",
  projectType: "",
  currencyCode: "PHP",
  startingBudget: 0,
};

const EMPTY_ITEM_FORM: BudgetItemFormInput = {
  projectId: "",
  name: "",
  status: "upcoming",
  category: "materials",
  estimatedCost: 0,
  actualSpent: 0,
  notes: "",
};

function formatMoney(value: number, currencyCode = "PHP"): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatNumberForInput(value: number): string {
  if (!value) return "";
  const [whole, fraction] = value.toString().split(".");
  const formattedWhole = new Intl.NumberFormat("en-US").format(Number(whole));
  return fraction ? `${formattedWhole}.${fraction}` : formattedWhole;
}

function sanitizeNumericInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole = "", ...fractionParts] = cleaned.split(".");
  const normalizedWhole = whole.replace(/^0+(?=\d)/, "") || (whole ? "0" : "");
  const formattedWhole = normalizedWhole
    ? new Intl.NumberFormat("en-US").format(Number(normalizedWhole))
    : "";
  const fraction = fractionParts.join("");
  if (cleaned.includes(".")) {
    return `${formattedWhole || "0"}.${fraction}`;
  }
  return formattedWhole;
}

function parseNumberInput(value: string): number {
  const normalized = value.replace(/,/g, "").trim();
  const amount = Number(normalized || 0);
  return Number.isFinite(amount) && amount > 0
    ? Math.round(amount * 100) / 100
    : 0;
}

function categoryLabel(value: BudgetItemCategory): string {
  return (
    BUDGET_ITEM_CATEGORY_OPTIONS.find((option) => option.value === value)
      ?.label ?? value
  );
}

function categoryColorClasses(value: BudgetItemCategory): {
  badge: string;
  text: string;
  bar: string;
} {
  switch (value) {
    case "materials":
      return {
        badge: "bg-emerald-50 text-emerald-700",
        text: "text-emerald-700",
        bar: "bg-emerald-600",
      };
    case "labor":
      return {
        badge: "bg-sky-50 text-sky-700",
        text: "text-sky-700",
        bar: "bg-sky-600",
      };
    case "equipment":
      return {
        badge: "bg-violet-50 text-violet-700",
        text: "text-violet-700",
        bar: "bg-violet-600",
      };
    case "permits":
      return {
        badge: "bg-amber-50 text-amber-700",
        text: "text-amber-700",
        bar: "bg-amber-500",
      };
    case "services":
      return {
        badge: "bg-rose-50 text-rose-700",
        text: "text-rose-700",
        bar: "bg-rose-500",
      };
    case "utilities":
      return {
        badge: "bg-cyan-50 text-cyan-700",
        text: "text-cyan-700",
        bar: "bg-cyan-600",
      };
    case "transportation":
      return {
        badge: "bg-orange-50 text-orange-700",
        text: "text-orange-700",
        bar: "bg-orange-500",
      };
    case "miscellaneous":
    default:
      return {
        badge: "bg-slate-100 text-slate-700",
        text: "text-slate-700",
        bar: "bg-slate-500",
      };
  }
}

function ButtonLoader({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/35 border-t-current" />
      <span>{label}</span>
    </span>
  );
}

export default function BudgetTrackerPageClient({
  projects,
  items,
  schemaReady,
  loadError,
}: {
  projects: BudgetProjectRow[];
  items: BudgetItemRow[];
  schemaReady: boolean;
  loadError: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [localProjects, setLocalProjects] = useState(projects);
  const [localItems, setLocalItems] = useState(items);
  const [selectedProjectId, setSelectedProjectId] = useState(
    projects[0]?.id ?? "",
  );
  const [projectSetupOpen, setProjectSetupOpen] = useState(
    projects.length === 0 && schemaReady,
  );
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemPanelVisible, setItemPanelVisible] = useState(false);
  const [deleteProjectModalOpen, setDeleteProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT_FORM);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM_FORM);
  const [projectBudgetInput, setProjectBudgetInput] = useState("");
  const [estimatedCostInput, setEstimatedCostInput] = useState("");
  const [actualSpentInput, setActualSpentInput] = useState("");
  const [projectError, setProjectError] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);
  const [activeDropStatus, setActiveDropStatus] =
    useState<BudgetItemStatus | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "project" | "item" | "delete-project" | "delete-item" | null
  >(null);

  useEffect(() => setLocalProjects(projects), [projects]);
  useEffect(() => setLocalItems(items), [items]);
  useEffect(() => {
    if (!itemModalOpen) {
      setItemPanelVisible(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setItemPanelVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [itemModalOpen]);

  useEffect(() => {
    if (!selectedProjectId && localProjects[0]?.id) {
      setSelectedProjectId(localProjects[0].id);
      return;
    }

    if (
      selectedProjectId &&
      !localProjects.some((project) => project.id === selectedProjectId)
    ) {
      setSelectedProjectId(localProjects[0]?.id ?? "");
    }
  }, [localProjects, selectedProjectId]);

  const selectedProject =
    localProjects.find((project) => project.id === selectedProjectId) ??
    localProjects[0] ??
    null;
  const selectedItems = useMemo(
    () => localItems.filter((item) => item.project_id === selectedProject?.id),
    [localItems, selectedProject?.id],
  );

  const groups = useMemo(
    () =>
      BUDGET_ITEM_STATUS_OPTIONS.map((status) => ({
        ...status,
        items: selectedItems.filter((item) => item.status === status.value),
      })),
    [selectedItems],
  );

  const summary = useMemo(() => {
    const startingBudget = selectedProject?.starting_budget ?? 0;
    const actualSpent = selectedItems.reduce(
      (sum, item) => sum + (item.actual_spent ?? 0),
      0,
    );
    return {
      startingBudget,
      actualSpent,
      remainingBudget: startingBudget - actualSpent,
      categoryTotals: BUDGET_ITEM_CATEGORY_OPTIONS.map((category) => {
        const total = selectedItems
          .filter((item) => item.category === category.value)
          .reduce((sum, item) => sum + (item.actual_spent ?? 0), 0);
        return {
          ...category,
          total,
          ratio: actualSpent > 0 ? total / actualSpent : 0,
        };
      }).filter((item) => item.total > 0),
    };
  }, [selectedItems, selectedProject]);

  function updateFormattedProjectBudget(value: string) {
    const formatted = sanitizeNumericInput(value);
    setProjectBudgetInput(formatted);
    setProjectForm((current) => ({
      ...current,
      startingBudget: parseNumberInput(formatted),
    }));
  }

  function updateFormattedEstimatedCost(value: string) {
    const formatted = sanitizeNumericInput(value);
    setEstimatedCostInput(formatted);
    setItemForm((current) => ({
      ...current,
      estimatedCost: parseNumberInput(formatted),
    }));
  }

  function updateFormattedActualSpent(value: string) {
    const formatted = sanitizeNumericInput(value);
    setActualSpentInput(formatted);
    setItemForm((current) => ({
      ...current,
      actualSpent: parseNumberInput(formatted),
    }));
  }

  function resetProjectForm() {
    setProjectForm(EMPTY_PROJECT_FORM);
    setProjectBudgetInput("");
    setProjectError(null);
  }

  function resetItemForm(status: BudgetItemStatus = "upcoming") {
    setItemForm({
      ...EMPTY_ITEM_FORM,
      projectId: selectedProject?.id ?? "",
      status,
    });
    setEstimatedCostInput("");
    setActualSpentInput("");
    setItemError(null);
  }

  function closeItemModal() {
    setItemModalOpen(false);
    setItemError(null);
  }

  function openNewItemModal(status: BudgetItemStatus = "upcoming") {
    resetItemForm(status);
    setItemModalOpen(true);
  }

  function openEditItemModal(item: BudgetItemRow) {
    setItemForm({
      id: item.id,
      projectId: item.project_id,
      name: item.name,
      status: item.status,
      category: item.category,
      estimatedCost: item.estimated_cost ?? 0,
      actualSpent: item.actual_spent ?? 0,
      notes: item.notes ?? "",
    });
    setEstimatedCostInput(formatNumberForInput(item.estimated_cost ?? 0));
    setActualSpentInput(formatNumberForInput(item.actual_spent ?? 0));
    setItemError(null);
    setItemModalOpen(true);
  }

  function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProjectError(null);
    setPendingAction("project");

    startTransition(async () => {
      try {
        const { project } = await createBudgetProjectAction(projectForm);
        setLocalProjects((current) => [project, ...current]);
        setSelectedProjectId(project.id);
        setProjectSetupOpen(false);
        resetProjectForm();
        toast.success("Budget project created.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create project.";
        setProjectError(message);
        toast.error(message);
      } finally {
        setPendingAction(null);
      }
    });
  }

  function submitItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setItemError(null);
    setPendingAction("item");

    startTransition(async () => {
      try {
        const savedItem = await saveBudgetItemAction(itemForm);
        setLocalItems((current) => {
          const hasExistingItem = current.some(
            (entry) => entry.id === savedItem.id,
          );
          if (hasExistingItem) {
            return current.map((entry) =>
              entry.id === savedItem.id ? savedItem : entry,
            );
          }
          return [...current, savedItem];
        });
        closeItemModal();
        toast.success(itemForm.id ? "Cost updated." : "Cost added.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to save cost.";
        setItemError(message);
        toast.error(message);
      } finally {
        setPendingAction(null);
      }
    });
  }

  function removeItem() {
    if (!itemForm.id) return;

    setPendingAction("delete-item");
    startTransition(async () => {
      try {
        await deleteBudgetItemAction(itemForm.id as string);
        setLocalItems((current) =>
          current.filter((entry) => entry.id !== itemForm.id),
        );
        closeItemModal();
        toast.success("Cost deleted.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete cost.",
        );
      } finally {
        setPendingAction(null);
      }
    });
  }

  function removeProject() {
    if (!selectedProject) return;

    setPendingAction("delete-project");
    startTransition(async () => {
      try {
        await deleteBudgetProjectAction(selectedProject.id);
        setLocalProjects((current) =>
          current.filter((project) => project.id !== selectedProject.id),
        );
        setLocalItems((current) =>
          current.filter((item) => item.project_id !== selectedProject.id),
        );
        setDeleteProjectModalOpen(false);
        toast.success("Project deleted.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete project.",
        );
      } finally {
        setPendingAction(null);
      }
    });
  }

  function dragStart(event: DragEvent<HTMLButtonElement>, itemId: string) {
    event.dataTransfer.setData("text/plain", itemId);
    event.dataTransfer.effectAllowed = "move";
  }

  function dragOver(
    event: DragEvent<HTMLDivElement>,
    status: BudgetItemStatus,
  ) {
    event.preventDefault();
    setActiveDropStatus(status);
  }

  function dropOn(event: DragEvent<HTMLDivElement>, status: BudgetItemStatus) {
    event.preventDefault();
    setActiveDropStatus(null);
    const itemId = event.dataTransfer.getData("text/plain");
    const item = selectedItems.find((entry) => entry.id === itemId);
    if (!item || item.status === status) return;

    const previousItems = localItems;
    setLocalItems((current) =>
      current.map((entry) =>
        entry.id === itemId ? { ...entry, status } : entry,
      ),
    );

    startTransition(async () => {
      try {
        const savedItem = await saveBudgetItemAction({
          id: item.id,
          projectId: item.project_id,
          name: item.name,
          status,
          category: item.category,
          estimatedCost: item.estimated_cost,
          actualSpent: item.actual_spent,
          notes: item.notes ?? "",
        });
        setLocalItems((current) =>
          current.map((entry) =>
            entry.id === savedItem.id ? savedItem : entry,
          ),
        );
      } catch (error) {
        setLocalItems(previousItems);
        toast.error(
          error instanceof Error ? error.message : "Failed to move cost.",
        );
      }
    });
  }

  const budgetHealthMessage =
    summary.remainingBudget >= 0
      ? `You still have ${formatMoney(summary.remainingBudget, selectedProject?.currency_code ?? "PHP")} left in this project budget.`
      : `This project is over budget by ${formatMoney(Math.abs(summary.remainingBudget), selectedProject?.currency_code ?? "PHP")}.`;

  const itemModal =
    itemModalOpen &&
    createPortal(
      <div className="fixed inset-0 z-[150] overflow-hidden bg-black/40">
        <div
          className="absolute inset-0"
          onClick={closeItemModal}
          aria-hidden="true"
        />
        <div
          className={cn(
            "absolute right-0 top-0 flex h-screen w-full max-w-md flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] transition-all duration-300 ease-out",
            itemPanelVisible
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0",
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-apple-mist px-5 py-4">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-apple-charcoal">
              {itemForm.id ? "Update Cost" : "Add Cost"}
            </h2>
            <button
              type="button"
              onClick={closeItemModal}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-apple-mist text-apple-smoke hover:bg-apple-mist/40"
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={submitItem} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-apple-charcoal">
                  What is this cost for?{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <p className="mb-2 text-sm text-apple-steel">
                  Give it a short name you can recognize.
                </p>
                <input
                  value={itemForm.name}
                  onChange={(event) =>
                    setItemForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. kitchen cabinets, architect fee"
                  className="w-full rounded-[10px] border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-3 text-sm outline-none focus:border-[#1f6a37]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-apple-charcoal">
                  Status <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {BUDGET_ITEM_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setItemForm((current) => ({
                          ...current,
                          status: option.value,
                        }))
                      }
                      className={cn(
                        "rounded-[10px] px-3 py-3 text-sm font-semibold transition",
                        itemForm.status === option.value &&
                          option.value === "upcoming"
                          ? "bg-rose-600 text-white shadow-[0_10px_20px_rgba(225,29,72,0.22)]"
                          : itemForm.status === option.value &&
                              option.value === "ongoing"
                            ? "bg-amber-500 text-white shadow-[0_10px_20px_rgba(245,158,11,0.24)]"
                            : itemForm.status === option.value
                              ? "bg-emerald-600 text-white shadow-[0_10px_20px_rgba(5,150,105,0.22)]"
                              : "bg-[rgb(var(--apple-snow))] text-apple-smoke hover:bg-white",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-apple-charcoal">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={itemForm.category}
                  onChange={(event) =>
                    setItemForm((current) => ({
                      ...current,
                      category: event.target.value as BudgetItemCategory,
                    }))
                  }
                  className="w-full rounded-[10px] border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-3 text-sm outline-none focus:border-[#1f6a37]"
                >
                  {BUDGET_ITEM_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-apple-charcoal">
                  Estimated cost
                </label>
                <p className="mb-2 text-sm text-apple-steel">
                  Your expected cost. You can update this anytime.
                </p>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-transparent before:text-apple-steel before:content-['\20B1']">
                    ₱
                  </span>
                  <input
                    value={estimatedCostInput}
                    onChange={(event) =>
                      updateFormattedEstimatedCost(event.target.value)
                    }
                    placeholder="0"
                    inputMode="decimal"
                    className="w-full rounded-[10px] border border-apple-mist bg-[rgb(var(--apple-snow))] px-9 py-3 text-sm outline-none focus:border-[#1f6a37]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-apple-charcoal">
                  Actual spent
                </label>
                <p className="mb-2 text-sm text-apple-steel">
                  How much you've paid so far. Leave blank if you haven't paid
                  yet.
                </p>
                <input
                  value={actualSpentInput}
                  onChange={(event) =>
                    updateFormattedActualSpent(event.target.value)
                  }
                  placeholder="Actual spent"
                  inputMode="decimal"
                  className="w-full rounded-[10px] border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-3 text-sm outline-none focus:border-[#1f6a37]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-apple-charcoal">
                  Notes
                </label>
                <p className="mb-2 text-sm text-apple-steel">
                  Anything you want to remember.
                </p>
                <textarea
                  value={itemForm.notes}
                  onChange={(event) =>
                    setItemForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="Notes"
                  className="w-full resize-none rounded-[10px] border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-3 text-sm outline-none focus:border-[#1f6a37]"
                />
              </div>
              {itemError ? (
                <p className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {itemError}
                </p>
              ) : null}
            </div>
            <div className="shrink-0 border-t border-apple-mist px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex flex-1 items-center justify-center rounded-[10px] bg-[#1f6a37] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {pendingAction === "item" ? (
                    <ButtonLoader
                      label={itemForm.id ? "Updating cost" : "Adding cost"}
                    />
                  ) : (
                    <span>{itemForm.id ? "Update cost" : "Add cost"}</span>
                  )}
                </button>
                {itemForm.id ? (
                  <button
                    type="button"
                    onClick={removeItem}
                    disabled={isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 disabled:opacity-60"
                  >
                    {pendingAction === "delete-item" ? (
                      <ButtonLoader label="Deleting" />
                    ) : (
                      <>
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                ) : null}
              </div>
              <p className="mt-3 text-center text-xs text-apple-steel">
                You can edit or delete this later.
              </p>
            </div>
          </form>
        </div>
      </div>,
      document.body,
    );

  const deleteProjectModal =
    deleteProjectModalOpen &&
    selectedProject &&
    createPortal(
      <div className="fixed inset-0 z-[160] bg-black/40">
        <div
          className="absolute inset-0"
          onClick={() => setDeleteProjectModalOpen(false)}
          aria-hidden="true"
        />
        <div className="absolute left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[14px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-700">
                Delete Project
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-apple-charcoal">
                Delete {selectedProject.name}?
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setDeleteProjectModalOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-red-200 text-red-500 hover:bg-red-200/40"
            >
              <X size={18} />
            </button>
          </div>
          <p className="mt-4 text-sm leading-6 text-apple-smoke">
            This will permanently remove the project and all of its budget
            items.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setDeleteProjectModalOpen(false)}
              className="inline-flex items-center justify-center rounded-[10px] border border-apple-mist px-4 py-3 text-sm font-medium text-apple-charcoal"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={removeProject}
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-[10px] border border-rose-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
            >
              {pendingAction === "delete-project" ? (
                <ButtonLoader label="Deleting project" />
              ) : (
                <span>Delete project</span>
              )}
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );

  return (
    <div className="">
      {!projectSetupOpen ? (
        <header
          style={{ height: "69px" }}
          className="sticky top-0 z-20 border-b border-apple-mist bg-white/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-white/85"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {selectedProject ? (
                <select
                  value={selectedProject.id}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  className="min-w-[280px] rounded-[10px] border border-apple-mist bg-white px-4 py-3 text-base font-semibold text-apple-charcoal outline-none focus:border-[#1f6a37]"
                >
                  {localProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-[10px] border border-apple-mist bg-white px-4 py-3 text-sm text-apple-smoke">
                  No project selected
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
              <button
                type="button"
                onClick={() => {
                  resetProjectForm();
                  setProjectSetupOpen(true);
                }}
                disabled={!schemaReady || isPending}
                className="inline-flex items-center gap-2 rounded-[10px] border border-apple-mist bg-white px-4 py-3 text-sm font-medium text-apple-charcoal transition hover:bg-apple-mist/40 disabled:opacity-60"
              >
                <FolderPlus size={16} />
                New project
              </button>
              <button
                type="button"
                onClick={() => openNewItemModal()}
                disabled={!selectedProject || !schemaReady || isPending}
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#1f6a37] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#18552b] disabled:opacity-60"
              >
                <Plus size={16} />
                Add cost
              </button>
              {selectedProject ? (
                <button
                  type="button"
                  onClick={() => setDeleteProjectModalOpen(true)}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-rose-200 bg-white px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 hover:text-rose-800 disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  Delete project
                </button>
              ) : null}
            </div>
          </div>
        </header>
      ) : null}

      {!schemaReady ? (
        <section className="rounded-[12px] border border-amber-200 bg-amber-50/70 p-6 text-amber-900 shadow-sm">
          <p className="text-sm font-semibold">
            Budget tracker tables are not available yet.
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-800/90">
            Run the SQL in{" "}
            <span className="font-semibold">
              supabase/budget-tracker-schema.sql
            </span>{" "}
            first, then refresh this page.
          </p>
          {loadError ? (
            <p className="mt-3 text-xs text-amber-700">{loadError}</p>
          ) : null}
        </section>
      ) : null}

      {projectSetupOpen ? (
        <section className="flex min-h-[calc(100vh-3rem)] w-full items-center justify-center">
          <div className="w-full max-w-lg">
            {localProjects.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setProjectSetupOpen(false);
                  resetProjectForm();
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-apple-steel transition hover:text-apple-charcoal"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            ) : null}

            <div className="mt-6">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-apple-charcoal">
                Set up your project
              </h2>
            </div>

            <form onSubmit={submitProject} className="mt-8 space-y-6">
              <div>
                <label className="text-sm font-semibold text-apple-charcoal">
                  Project name <span className="text-rose-500">*</span>
                </label>
                <input
                  value={projectForm.name}
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Dream Home, Kitchen Renovation"
                  className="mt-2 w-full rounded-[10px] border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-3 text-sm outline-none focus:border-[#1f6a37]"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-apple-charcoal">
                  Project type
                </label>
                <select
                  value={projectForm.projectType}
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      projectType: event.target.value as BudgetProjectType | "",
                    }))
                  }
                  className="mt-2 w-full rounded-[10px] border border-apple-mist bg-white px-4 py-3 text-sm outline-none focus:border-[#1f6a37]"
                >
                  <option value="">Select a type</option>
                  {BUDGET_PROJECT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-apple-charcoal">
                  Currency <span className="text-rose-500">*</span>
                </label>
                <input
                  value="Philippine Peso (PHP)"
                  readOnly
                  className="mt-2 w-full rounded-[10px] border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-3 text-sm text-apple-charcoal outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-apple-charcoal">
                  Starting budget
                </label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-apple-steel">
                    ₱
                  </span>
                  <input
                    value={projectBudgetInput}
                    onChange={(event) =>
                      updateFormattedProjectBudget(event.target.value)
                    }
                    placeholder="2,500,000"
                    inputMode="decimal"
                    className="w-full rounded-[10px] border border-apple-mist bg-[rgb(var(--apple-snow))] px-9 py-3 text-sm outline-none focus:border-[#1f6a37]"
                  />
                </div>
              </div>

              {projectError ? (
                <p className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {projectError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex w-full items-center justify-center rounded-[10px] bg-[#1f6a37] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pendingAction === "project" ? (
                  <ButtonLoader label="Starting tracking costs" />
                ) : (
                  <span>Start tracking costs</span>
                )}
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {selectedProject && !projectSetupOpen ? (
        <section className="grid min-h-[calc(100vh-69px)] gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-5 p-3 xl:grid-cols-3">
            {groups.map((group) => (
              <div key={group.value} className="space-y-3">
                <div className="flex items-start justify-between gap-3 ">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          group.dotClassName,
                        )}
                      />
                      <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-apple-charcoal">
                        {group.label}
                      </h2>
                    </div>
                    <p className="mt-2 text-sm text-apple-smoke">
                      {group.items.length} item
                      {group.items.length === 1 ? "" : "s"} |{" "}
                      {formatMoney(
                        group.items.reduce(
                          (sum, item) => sum + (item.estimated_cost ?? 0),
                          0,
                        ),
                        selectedProject.currency_code,
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openNewItemModal(group.value)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-apple-mist text-apple-smoke hover:bg-apple-mist/40 hover:text-apple-charcoal"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div
                  className={cn(
                    "min-h-[520px] rounded-[14px] border border-apple-mist bg-[rgb(var(--apple-snow))] p-3",
                    activeDropStatus === group.value &&
                      "ring-2 ring-[#1f6a37]/20",
                  )}
                  onDragOver={(event) => dragOver(event, group.value)}
                  onDragLeave={() => setActiveDropStatus(null)}
                  onDrop={(event) => dropOn(event, group.value)}
                >
                  {group.items.length === 0 ? (
                    <div className="flex min-h-[470px] items-center justify-center rounded-[12px] px-6 text-center text-sm leading-8 text-apple-steel">
                      {group.value === "upcoming"
                        ? "Add items you expect to pay."
                        : group.value === "ongoing"
                          ? "Move items here when payments begin."
                          : "Move items here once fully paid."}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {group.items.map((item) => {
                        const variance =
                          Math.round(
                            ((item.estimated_cost ?? 0) -
                              (item.actual_spent ?? 0)) *
                              100,
                          ) / 100;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            draggable
                            onDragStart={(event) => dragStart(event, item.id)}
                            onClick={() => openEditItemModal(item)}
                            className="w-full rounded-[12px] border border-apple-mist bg-white p-4 text-left shadow-[0_8px_20px_rgba(24,83,43,0.06)] transition hover:-translate-y-0.5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-[17px] font-semibold tracking-[-0.02em] text-apple-charcoal">
                                  {item.name}
                                </p>
                                <p className="mt-2 text-xs font-medium uppercase tracking-[0.22em] text-apple-steel">
                                  {group.label}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "rounded-full px-3 py-1 text-xs font-semibold",
                                  categoryColorClasses(item.category).badge,
                                )}
                              >
                                {categoryLabel(item.category)}
                              </span>
                            </div>
                            <div className="mt-5 space-y-3 text-sm">
                              <div className="flex items-center justify-between text-apple-smoke">
                                <span>Estimated cost</span>
                                <span className="font-semibold text-apple-charcoal">
                                  {formatMoney(
                                    item.estimated_cost ?? 0,
                                    selectedProject.currency_code,
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-apple-smoke">
                                <span>Actual spent</span>
                                <span className="font-semibold text-apple-charcoal">
                                  {formatMoney(
                                    item.actual_spent ?? 0,
                                    selectedProject.currency_code,
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center justify-between border-t border-apple-mist pt-3">
                                <span className="text-apple-smoke">
                                  {variance >= 0
                                    ? "Under budget"
                                    : "Over budget"}
                                </span>
                                <span
                                  className={cn(
                                    "font-semibold",
                                    variance >= 0
                                      ? "text-emerald-600"
                                      : "text-rose-600",
                                  )}
                                >
                                  {formatMoney(
                                    Math.abs(variance),
                                    selectedProject.currency_code,
                                  )}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <aside className="self-stretch xl:border-l xl:border-apple-mist xl:p-4">
            <div className="h-full max-h-[calc(100vh-110px)] overflow-y-auto pr-2">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-apple-charcoal">
                Summary
              </h2>
              <div className="mt-7 space-y-5">
                <div>
                  <p className="text-sm text-apple-steel">Starting budget</p>
                  <p className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-apple-charcoal">
                    {formatMoney(
                      summary.startingBudget,
                      selectedProject.currency_code,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-apple-steel">Actual spent</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-rose-600">
                    {formatMoney(
                      summary.actualSpent,
                      selectedProject.currency_code,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-apple-steel">Remaining budget</p>
                  <p
                    className={cn(
                      "mt-1 text-2xl font-semibold tracking-[-0.03em]",
                      summary.remainingBudget >= 0
                        ? "text-emerald-600"
                        : "text-rose-600",
                    )}
                  >
                    {formatMoney(
                      summary.remainingBudget,
                      selectedProject.currency_code,
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-[12px] bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-800">
                {summary.actualSpent === 0
                  ? "No actual spending recorded yet."
                  : budgetHealthMessage}
              </div>
              <div className="mt-6">
                <p className="text-sm font-semibold text-apple-charcoal">
                  Spending by category
                </p>
                <div className="mt-4 space-y-4">
                  {summary.categoryTotals.length === 0 ? (
                    <div className="rounded-[12px] border border-dashed border-apple-mist px-4 py-5 text-sm text-apple-steel">
                      No category spending recorded yet.
                    </div>
                  ) : (
                    summary.categoryTotals.map((category) => (
                      <div key={category.value}>
                        <div className="flex items-center justify-between text-sm">
                          <span
                            className={cn(
                              "font-medium",
                              categoryColorClasses(category.value).text,
                            )}
                          >
                            {category.label}
                          </span>
                          <span className="text-apple-smoke">
                            {formatMoney(
                              category.total,
                              selectedProject.currency_code,
                            )}
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-apple-mist">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              categoryColorClasses(category.value).bar,
                            )}
                            style={{
                              width: `${Math.max(category.ratio * 100, 4)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </aside>
        </section>
      ) : null}

      {itemModal}
      {deleteProjectModal}
    </div>
  );
}
