import {
  type BudgetProjectRow,
  type BudgetTrackerSummary,
} from "@/features/budget-tracker/types";
import {
  formatBudgetMoney,
  getBudgetCategoryColorClasses,
} from "@/features/budget-tracker/utils/budgetTrackerFormatters";
import { cn } from "@/lib/utils";

export default function BudgetTrackerSummaryPanel({
  selectedProject,
  summary,
  budgetHealthMessage,
}: {
  selectedProject: BudgetProjectRow;
  summary: BudgetTrackerSummary;
  budgetHealthMessage: string;
}) {
  return (
    <aside className="self-stretch border-t border-apple-mist px-4 pt-4  xl:border-l xl:border-t-0 xl:border-apple-mist xl:p-4">
      <div className="h-full pb-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-apple-charcoal">
            Summary
          </h2>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
            Draft
          </span>
        </div>
        <div className="mt-7 space-y-5">
          <div>
            <p className="text-sm text-apple-steel">Starting budget</p>
            <p className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-apple-charcoal">
              {formatBudgetMoney(
                summary.startingBudget,
                selectedProject.currency_code,
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-apple-steel">Actual spent</p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-rose-600">
              {formatBudgetMoney(
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
              {formatBudgetMoney(
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
                        getBudgetCategoryColorClasses(category.value).text,
                      )}
                    >
                      {category.label}
                    </span>
                    <span className="text-apple-smoke">
                      {formatBudgetMoney(
                        category.total,
                        selectedProject.currency_code,
                      )}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-apple-mist">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        getBudgetCategoryColorClasses(category.value).bar,
                      )}
                      style={{ width: `${Math.max(category.ratio * 100, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
