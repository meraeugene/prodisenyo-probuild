"use client";
import { LoaderCircle, Trash2 } from "lucide-react";
import WorkspaceDialog from "@/components/workspace/WorkspaceDialog";
import styles from "@/components/workspace/workspace.module.css";
import CostEstimatorItemFields from "./CostEstimatorItemFields";
import CostEstimatorItemSummary from "./CostEstimatorItemSummary";
import type { CostEstimatorItemModalProps } from "../types";

export default function CostEstimatorItemModal(props: CostEstimatorItemModalProps) {
  const readOnly = Boolean(props.readOnly);
  return <WorkspaceDialog open={props.open} title={readOnly ? "View BOQ item" : props.editing ? "Edit BOQ item" : "Add BOQ item"}
    description={readOnly ? "Review the item details and costs." : "Enter the item details and its material costs."} size="lg" pending={props.pending} onClose={props.onClose}
    footer={<><div className="mr-auto">{props.editing && !readOnly && <button type="button" onClick={props.onDelete} disabled={props.pending} className={styles.dangerButton}><Trash2 size={14} aria-hidden="true" />Delete item</button>}</div><button type="button" onClick={props.onClose} disabled={props.pending} className={styles.button}>{readOnly ? "Close" : "Cancel"}</button>{!readOnly && <button type="button" onClick={props.onSave} disabled={props.pending} className={styles.primaryButton}>{props.pending && <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />}{props.pending ? "Saving..." : props.editing ? "Save changes" : "Save item"}</button>}</>}>
    <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_230px]">
      <CostEstimatorItemFields form={props.form} errors={props.errors} materials={props.materials} itemNumberLabel={props.itemNumberLabel} readOnly={props.readOnly} pending={props.pending}
        onFieldChange={props.onFieldChange} onSelectMaterial={props.onSelectMaterial} onSelectUnitType={props.onSelectUnitType} onMaterialRowFieldChange={props.onMaterialRowFieldChange} onAddMaterial={props.onAddMaterial} onRemoveMaterial={props.onRemoveMaterial} />
      <CostEstimatorItemSummary baseEstimateTotal={props.baseEstimateTotal} itemTotal={props.computedTotal} budgetCeiling={props.budgetCeiling} />
    </div>
  </WorkspaceDialog>;
}
