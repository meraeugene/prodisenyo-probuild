"use client";

import { Plus } from "lucide-react";
import type { CostEstimatorItemModalProps } from "../types";
import MaterialFields from "./CostEstimatorMaterialFields";
import styles from "./costEstimatorItemModal.module.css";
import workspace from "@/components/workspace/workspace.module.css";

type Props = Pick<CostEstimatorItemModalProps, "form" | "errors" | "materials" | "itemNumberLabel" | "readOnly" | "pending" | "onFieldChange" | "onSelectMaterial" | "onSelectUnitType" | "onMaterialRowFieldChange" | "onRemoveMaterial"> & {
  activeLineIndex: number;
  onSelectLine: (index: number) => void;
  onAddLine: () => void;
};

export default function CostEstimatorItemFields(props: Props) {
  const disabled = Boolean(props.readOnly || props.pending);
  const allUnits = Array.from(new Map(props.materials.flatMap(material => material.units)
    .map(unit => [unit.unitType.toLowerCase(), unit])).values())
    .sort((left, right) => left.unitType.localeCompare(right.unitType));
  const active = props.form.materials[props.activeLineIndex];

  return <>
    <section className={styles.pane} data-panel="details" aria-label="Item details">
      <h3 className={styles.paneTitle}>Item details</h3>
      <div className={styles.details}>
        <div className={styles.detailRow}>
          <label className={styles.field}>Section / Category *
            <input list="boq-section-options" value={props.form.section} onChange={event => props.onFieldChange("section", event.target.value)}
              disabled={disabled} placeholder="e.g. Structural Works" aria-invalid={Boolean(props.errors.section)} />
            <datalist id="boq-section-options">{["General Requirements", "Site Works", "Structural Works", "Architectural / Finishing", "Mechanical Works", "Electrical Works", "Plumbing Works"].map(section => <option key={section} value={section} />)}</datalist>
            {props.errors.section && <span className={styles.error}>{props.errors.section}</span>}
          </label>
          <label className={styles.field}>Item No. *
            <input value={props.form.itemNumber} onChange={event => props.onFieldChange("itemNumber", event.target.value)} disabled={disabled}
              placeholder={props.itemNumberLabel} aria-invalid={Boolean(props.errors.itemNumber)} />
            {props.errors.itemNumber && <span className={styles.error}>{props.errors.itemNumber}</span>}
          </label>
        </div>
        <label className={styles.field}>Description *
          <textarea value={props.form.displayName} onChange={event => props.onFieldChange("displayName", event.target.value)} disabled={disabled}
            placeholder="Describe this BOQ item" rows={3} aria-invalid={Boolean(props.errors.displayName)} />
          {props.errors.displayName && <span className={styles.error}>{props.errors.displayName}</span>}
        </label>
        <label className={styles.field}>Notes <span className={styles.optional}>(optional)</span>
          <textarea value={props.form.notes} onChange={event => props.onFieldChange("notes", event.target.value)} disabled={disabled}
            maxLength={500} rows={3} placeholder="Add details for this BOQ item" />
          <span className={styles.hint}>{props.form.notes.length} / 500</span>
        </label>
      </div>
    </section>
    <section className={styles.pane} data-panel="costs" aria-label="Material costs">
      <h3 className={styles.paneTitle}>Material costs</h3>
      <div className={styles.lineToolbar}>
        <select className={styles.lineSelect} aria-label="Cost line" value={props.activeLineIndex} disabled={props.pending}
          onChange={event => props.onSelectLine(Number(event.target.value))}>
          {props.form.materials.map((row, index) => <option key={row.id} value={index}>Line {index + 1} of {props.form.materials.length}{row.searchInput ? ` · ${row.searchInput}` : " · New cost line"}</option>)}
        </select>
        {!props.readOnly && <button type="button" onClick={props.onAddLine} disabled={props.pending} className={workspace.button}>
          <Plus size={14} aria-hidden="true" />Add cost line
        </button>}
      </div>
      {active && <MaterialFields material={active} index={props.activeLineIndex} canRemove={props.form.materials.length > 1}
        materials={props.materials} allUnits={allUnits} errors={props.errors.materialRows[active.id] ?? {}} disabled={disabled}
        onSelectMaterial={props.onSelectMaterial} onSelectUnitType={props.onSelectUnitType}
        onFieldChange={props.onMaterialRowFieldChange} onRemove={props.onRemoveMaterial} />}
    </section>
  </>;
}
