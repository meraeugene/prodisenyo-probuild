"use client";

import { formatBudgetMoney } from "../utils/costEstimatorFormatters";
import styles from "./costEstimatorItemModal.module.css";

export default function CostEstimatorItemSummary({ baseEstimateTotal, itemTotal, budgetCeiling }: {
  baseEstimateTotal: number; itemTotal: number; budgetCeiling: number | null;
}) {
  const estimatedCost = baseEstimateTotal + itemTotal;
  const remaining = budgetCeiling === null ? null : budgetCeiling - estimatedCost;
  return <aside className={styles.summary} data-panel="summary" aria-label="Estimate summary">
    <h3 className={styles.paneTitle}>Estimate summary</h3>
    <dl>
      <div><dt>This Item Total</dt><dd>{formatBudgetMoney(itemTotal)}</dd></div>
      <div><dt>Estimated Cost</dt><dd>{formatBudgetMoney(estimatedCost)}</dd></div>
      <div><dt>Remaining Budget</dt><dd className={remaining !== null && remaining < 0 ? styles.overBudget : undefined}>{remaining === null ? "Unavailable" : formatBudgetMoney(remaining)}</dd>
        <p>After saving this item</p>
      </div>
    </dl>
  </aside>;
}
