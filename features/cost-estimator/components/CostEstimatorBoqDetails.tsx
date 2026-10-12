"use client";
import { ArrowLeft, FileText, Pencil } from "lucide-react";
import WorkspacePageHeader from "@/components/workspace/WorkspacePageHeader";
import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import styles from "@/components/workspace/workspace.module.css";
import CostEstimatorBoqSidebar from "./CostEstimatorBoqSidebar";
import CostEstimatorBoqTable from "./CostEstimatorBoqTable";
import EstimateProjectFacts from "./EstimateProjectFacts";
import { formatBudgetMoney, formatEstimateStatusLabel, formatProjectTypeLabel } from "../utils/costEstimatorFormatters";
import { countEstimateBoqItems } from "../utils/estimatePortfolio";
import type { ProjectEstimateItemRow, ProjectEstimateRow } from "../types";

export default function CostEstimatorBoqDetails({ estimate, items, budgetCeiling, pending, onBack, onViewReport, onEdit }: {
  estimate: ProjectEstimateRow; items: ProjectEstimateItemRow[]; budgetCeiling: number | null; pending: boolean;
  onBack: () => void; onViewReport: () => void; onEdit?: () => void;
}) {
  const categoryTotal = (category: ProjectEstimateItemRow["category_snapshot"]) => items.filter(item => item.category_snapshot === category).reduce((sum, item) => sum + Number(item.line_total ?? 0), 0);
  return <div className={`${styles.page} space-y-5`}>
    <button type="button" onClick={onBack} disabled={pending} className="inline-flex items-center gap-2 text-xs font-medium text-[#076d69] hover:underline"><ArrowLeft size={14} aria-hidden="true" />Back to cost estimator</button>
    <WorkspacePageHeader eyebrow="Engineer / Cost estimator / BOQ" title={`${estimate.project_name} - BOQ Details`} description="Review the Bill of Quantities, estimated costs, and CEO review notes."
      actions={<><button type="button" onClick={onViewReport} className={styles.button}><FileText size={14} aria-hidden="true" />View report</button>{onEdit && <button type="button" onClick={onEdit} disabled={pending} className={styles.primaryButton}><Pencil size={14} aria-hidden="true" />Edit BOQ</button>}</>} />
    <EstimateProjectFacts facts={[
      { label: "Project type", value: formatProjectTypeLabel(estimate.project_type) }, { label: "Location", value: estimate.location || "Not recorded" }, { label: "Owner", value: estimate.owner_name || "Not recorded" }, { label: "Status", value: formatEstimateStatusLabel(estimate.status) },
    ]} />
    <WorkspaceSummaryCards ariaLabel="BOQ totals" className="grid-cols-2 xl:grid-cols-5" cards={[
      { label: "BOQ items", value: countEstimateBoqItems(items) }, { label: "Materials", value: formatBudgetMoney(categoryTotal("materials")) }, { label: "Labor", value: formatBudgetMoney(categoryTotal("labor")) }, { label: "Equipment", value: formatBudgetMoney(categoryTotal("equipment")) }, { label: "Total estimate", value: formatBudgetMoney(estimate.estimate_total) },
    ]} />
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"><CostEstimatorBoqTable items={items} /><CostEstimatorBoqSidebar estimate={estimate} budgetCeiling={budgetCeiling} /></div>
  </div>;
}
