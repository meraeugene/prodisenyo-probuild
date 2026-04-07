import { ArrowLeft } from "lucide-react";
import ButtonLoader from "@/features/budget-tracker/components/ButtonLoader";
import {
  BUDGET_PROJECT_TYPE_OPTIONS,
  type BudgetProjectFormInput,
  type BudgetProjectRow,
} from "@/features/budget-tracker/types";
import type { BudgetProjectType } from "@/types/database";

export default function BudgetTrackerSetupForm({
  projects,
  projectForm,
  projectBudgetInput,
  projectError,
  isPending,
  pendingAction,
  onBack,
  onSubmit,
  onProjectFormChange,
  onProjectBudgetChange,
}: {
  projects: BudgetProjectRow[];
  projectForm: BudgetProjectFormInput;
  projectBudgetInput: string;
  projectError: string | null;
  isPending: boolean;
  pendingAction: "project" | "item" | "delete-project" | "delete-item" | null;
  onBack: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onProjectFormChange: (
    updater: (current: BudgetProjectFormInput) => BudgetProjectFormInput,
  ) => void;
  onProjectBudgetChange: (value: string) => void;
}) {
  return (
    <section className="flex min-h-[calc(100vh-3rem)] w-full items-center justify-center">
      <div className="w-full max-w-lg">
        {projects.length > 0 ? (
          <button
            type="button"
            onClick={onBack}
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

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <div>
            <label className="text-sm font-semibold text-apple-charcoal">
              Project name <span className="text-rose-500">*</span>
            </label>
            <input
              value={projectForm.name}
              onChange={(event) =>
                onProjectFormChange((current) => ({
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
                onProjectFormChange((current) => ({
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
                P
              </span>
              <input
                value={projectBudgetInput}
                onChange={(event) => onProjectBudgetChange(event.target.value)}
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
            className="inline-flex w-full items-center justify-center rounded-[10px] bg-[#1f6a37] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
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
  );
}
