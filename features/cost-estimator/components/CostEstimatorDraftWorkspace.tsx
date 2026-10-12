"use client";

import { ArrowLeft, LoaderCircle, Save, Send, Trash2 } from "lucide-react";
import WorkspacePageHeader from "@/components/workspace/WorkspacePageHeader";
import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import EstimateProjectFacts from "./EstimateProjectFacts";
import styles from "@/components/workspace/workspace.module.css";
import CostEstimatorDraftSidebar from "@/features/cost-estimator/components/CostEstimatorDraftSidebar";
import CostEstimatorDraftTable from "@/features/cost-estimator/components/CostEstimatorDraftTable";
import { formatBudgetMoney, formatProjectTypeLabel } from "@/features/cost-estimator/utils/costEstimatorFormatters";
import type { AssignedEstimateProject, CostCatalogItemRow, ProjectEstimateDraftForm, ProjectEstimateRow } from "@/features/cost-estimator/types";
import type { BudgetItemCategory } from "@/types/database";

export default function CostEstimatorDraftWorkspace({
  estimate,
  form,
  linkedProject,
  catalogItems,
  disabled,
  saveMessage,
  submitting,
  onBack,
  onFieldChange,
  onAdd,
  onEdit,
  onDeleteItem,
  onSave,
  onSubmit,
  onDeleteDraft,
}: {
  estimate: ProjectEstimateRow;
  form: ProjectEstimateDraftForm;
  linkedProject: AssignedEstimateProject | null;
  catalogItems: CostCatalogItemRow[];
  disabled: boolean;
  saveMessage: string;
  submitting: boolean;
  onBack: () => void;
  onFieldChange: (field: Exclude<keyof ProjectEstimateDraftForm, "items" | "id">, value: string) => void;
  onAdd: () => void;
  onEdit: (indices: number[]) => void;
  onDeleteItem: (indices: number[]) => void;
  onSave: () => void;
  onSubmit: () => void;
  onDeleteDraft: () => void;
}) {
  const categoryByCatalogId = new Map(catalogItems.map((item) => [item.id, item.category]));
  const categoryTotal = (category: BudgetItemCategory) => form.items.reduce((sum, item) => sum + (categoryByCatalogId.get(item.catalogItemId) === category ? item.lineTotal : 0), 0);
  const total = form.items.reduce((sum, item) => sum + item.lineTotal, 0);
  const boqItemCount = new Set(
    form.items.map(
      (item) =>
        item.section.trim().toLowerCase() +
        "::" +
        item.itemNumber.trim().toLowerCase(),
    ),
  ).size;
  const budgetCeiling = linkedProject?.budgetCeiling ?? null;
  const draftedDate = form.draftedDate || estimate.created_at;

  return (
    <div className={`${styles.page} space-y-5`}>
      <button type="button" onClick={onBack} disabled={disabled} className="inline-flex items-center gap-2 text-xs font-medium text-[#076d69] hover:underline"><ArrowLeft size={14} aria-hidden="true"/>Back to cost estimator</button>
      <WorkspacePageHeader eyebrow="Engineer / Cost estimator / Draft" title="Prepare estimate" description={`Build the Bill of Quantities for ${form.projectName}.`}
        actions={<><button type="button" onClick={onSave} disabled={disabled} className={styles.button}><Save size={14} aria-hidden="true"/>Save Draft</button><button type="button" onClick={onSubmit} disabled={disabled} className={styles.primaryButton}>{submitting?<LoaderCircle size={14} className="animate-spin" aria-hidden="true"/>:<Send size={14} aria-hidden="true"/>}{submitting?'Submitting...':'Submit to CEO'}</button></>}/>
      <EstimateProjectFacts facts={[{label:'Project type',value:formatProjectTypeLabel(form.projectType||null)},{label:'Location',value:form.location||'Not recorded'},{label:'Owner',value:form.ownerName||'Not recorded'},{label:'Budget ceiling',value:budgetCeiling===null?'Not recorded':formatBudgetMoney(budgetCeiling)},{label:'Date',value:draftedDate?new Intl.DateTimeFormat('en-PH',{dateStyle:'medium'}).format(new Date(draftedDate)):'Not recorded'},{label:'Status',value:'Draft'}]}/>

      <WorkspaceSummaryCards ariaLabel="Estimate totals" className="grid-cols-2 xl:grid-cols-5" cards={[{label:'BOQ items',value:boqItemCount},{label:'Materials',value:formatBudgetMoney(categoryTotal('materials'))},{label:'Labor',value:formatBudgetMoney(categoryTotal('labor'))},{label:'Equipment',value:formatBudgetMoney(categoryTotal('equipment'))},{label:'Total estimate',value:formatBudgetMoney(total)}]}/>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500" aria-live="polite">{saveMessage}</p><button type="button" onClick={onDeleteDraft} disabled={disabled} className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 hover:underline"><Trash2 size={14} aria-hidden="true"/>Delete Draft</button></div>
          <CostEstimatorDraftTable items={form.items} disabled={disabled} onAdd={onAdd} onEdit={onEdit} onDelete={onDeleteItem} />
        </div>
        <CostEstimatorDraftSidebar estimatedCost={total} budgetCeiling={budgetCeiling} notes={form.notes} disabled={disabled} onNotesChange={(value) => onFieldChange("notes", value)} />
      </div>
    </div>
  );
}
