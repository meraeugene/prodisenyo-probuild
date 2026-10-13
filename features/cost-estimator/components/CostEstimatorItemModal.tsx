"use client";
import { LoaderCircle, Trash2 } from "lucide-react";
import WorkspaceDialog from "@/components/workspace/WorkspaceDialog";
import styles from "@/components/workspace/workspace.module.css";
import CostEstimatorItemFields from "./CostEstimatorItemFields";
import CostEstimatorItemSummary from "./CostEstimatorItemSummary";
import type { CostEstimatorItemModalProps } from "../types";
import layout from "./costEstimatorItemModal.module.css";
import { useBoqItemLayout, type BoqItemPane } from "../hooks/useBoqItemLayout";

export default function CostEstimatorItemModal(props: CostEstimatorItemModalProps) {
  const readOnly = Boolean(props.readOnly);
  const { pane, setPane, activeLineIndex, setActiveLineIndex, addCostLine, saveItem } = useBoqItemLayout(props);
  return <WorkspaceDialog open={props.open} title={readOnly ? "View BOQ item" : props.editing ? "Edit BOQ item" : "Add BOQ item"}
    description={readOnly ? "Review the item details and costs." : "Add the item details, material costs, and review the total."} size="xl" className={layout.dialog} bodyClassName={layout.body} pending={props.pending} onClose={props.onClose}
    footer={<><div className="mr-auto">{props.editing && !readOnly && <button type="button" onClick={props.onDelete} disabled={props.pending} className={styles.dangerButton}><Trash2 size={14} aria-hidden="true" />Delete item</button>}</div><button type="button" onClick={props.onClose} disabled={props.pending} className={styles.button}>{readOnly ? "Close" : "Cancel"}</button>{!readOnly && <button type="button" onClick={saveItem} disabled={props.pending} className={styles.primaryButton}>{props.pending && <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />}{props.pending ? "Saving..." : props.editing ? "Save changes" : "Save item"}</button>}</>}>
    <nav className={layout.tabs} aria-label="BOQ item sections">{([ ["details", "Item details"], ["costs", "Cost lines"], ["summary", "Summary"] ] as [BoqItemPane, string][]).map(([value, label]) =>
      <button key={value} type="button" aria-pressed={pane === value} onClick={() => setPane(value)}>{label}</button>)}
    </nav>
    <div className={layout.columns} data-pane={pane}>
      <CostEstimatorItemFields form={props.form} errors={props.errors} materials={props.materials} itemNumberLabel={props.itemNumberLabel} readOnly={props.readOnly} pending={props.pending}
        onFieldChange={props.onFieldChange} onSelectMaterial={props.onSelectMaterial} onSelectUnitType={props.onSelectUnitType} onMaterialRowFieldChange={props.onMaterialRowFieldChange} onRemoveMaterial={props.onRemoveMaterial}
        activeLineIndex={activeLineIndex} onSelectLine={setActiveLineIndex} onAddLine={addCostLine} />
      <CostEstimatorItemSummary baseEstimateTotal={props.baseEstimateTotal} itemTotal={props.computedTotal} budgetCeiling={props.budgetCeiling} />
    </div>
  </WorkspaceDialog>;
}
