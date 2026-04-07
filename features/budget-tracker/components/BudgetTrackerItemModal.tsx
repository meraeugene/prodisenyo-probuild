import { createPortal } from "react-dom";
import { Trash2, X } from "lucide-react";
import ButtonLoader from "@/features/budget-tracker/components/ButtonLoader";
import {
  BUDGET_ITEM_CATEGORY_OPTIONS,
  BUDGET_ITEM_STATUS_OPTIONS,
  type BudgetItemFormInput,
} from "@/features/budget-tracker/types";
import { cn } from "@/lib/utils";
import type { BudgetItemCategory } from "@/types/database";

export default function BudgetTrackerItemModal({
  open,
  itemPanelVisible,
  itemForm,
  estimatedCostInput,
  actualSpentInput,
  itemError,
  isPending,
  pendingAction,
  onClose,
  onSubmit,
  onRemove,
  onItemFormChange,
  onEstimatedCostChange,
  onActualSpentChange,
}: {
  open: boolean;
  itemPanelVisible: boolean;
  itemForm: BudgetItemFormInput;
  estimatedCostInput: string;
  actualSpentInput: string;
  itemError: string | null;
  isPending: boolean;
  pendingAction: "project" | "item" | "delete-project" | "delete-item" | null;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onRemove: () => void;
  onItemFormChange: (
    updater: (current: BudgetItemFormInput) => BudgetItemFormInput,
  ) => void;
  onEstimatedCostChange: (value: string) => void;
  onActualSpentChange: (value: string) => void;
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] overflow-hidden bg-black/40">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
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
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-apple-mist text-apple-smoke hover:bg-apple-mist/40"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-apple-charcoal">
                What is this cost for? <span className="text-rose-500">*</span>
              </label>
              <p className="mb-2 text-sm text-apple-steel">
                Give it a short name you can recognize.
              </p>
              <input
                value={itemForm.name}
                onChange={(event) =>
                  onItemFormChange((current) => ({
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
                      onItemFormChange((current) => ({
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
                  onItemFormChange((current) => ({
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
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-apple-steel">
                  P
                </span>
                <input
                  value={estimatedCostInput}
                  onChange={(event) =>
                    onEstimatedCostChange(event.target.value)
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
                How much you&rsquo;ve paid so far. Leave blank if you
                haven&rsquo;t paid yet.
              </p>
              <input
                value={actualSpentInput}
                onChange={(event) => onActualSpentChange(event.target.value)}
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
                  onItemFormChange((current) => ({
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
                className="inline-flex flex-1 items-center justify-center rounded-[10px] bg-[#1f6a37] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
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
                  onClick={onRemove}
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
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
}
