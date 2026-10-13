"use client";

import { Trash2 } from "lucide-react";
import { formatBudgetMoney, formatBudgetNumberForInput, parseBudgetNumberInput } from "../utils/costEstimatorFormatters";
import type { CostEstimatorItemModalProps, EstimateItemModalMaterialForm, EstimateItemMaterialErrors } from "../types";
import styles from "./costEstimatorItemModal.module.css";
import workspace from "@/components/workspace/workspace.module.css";

type Props = {
  material: EstimateItemModalMaterialForm;
  index: number;
  canRemove: boolean;
  materials: CostEstimatorItemModalProps["materials"];
  allUnits: CostEstimatorItemModalProps["materials"][number]["units"];
  errors: EstimateItemMaterialErrors;
  disabled: boolean;
  onSelectMaterial: CostEstimatorItemModalProps["onSelectMaterial"];
  onSelectUnitType: CostEstimatorItemModalProps["onSelectUnitType"];
  onFieldChange: CostEstimatorItemModalProps["onMaterialRowFieldChange"];
  onRemove: CostEstimatorItemModalProps["onRemoveMaterial"];
};

export default function MaterialFields({ material, index, canRemove, materials, allUnits, errors, disabled, onSelectMaterial, onSelectUnitType, onFieldChange, onRemove }: Props) {
  const selected = materials.find(entry => entry.materialId === material.materialId);
  const units = selected?.units.length ? selected.units : allUnits;
  const lineTotal = parseBudgetNumberInput(material.unitCostInput) * parseBudgetNumberInput(material.quantityInput);

  function handleMaterialName(value: string) {
    onFieldChange(material.id, "searchInput", value);
    const match = materials.find(entry => entry.materialName.toLowerCase() === value.trim().toLowerCase());
    if (match) onSelectMaterial(material.id, match.materialId);
  }

  return <div className={styles.material}>
    <div className={styles.materialHeading}>
      <h3>Cost line {index + 1}</h3>
      {canRemove && !disabled && <button type="button" onClick={() => onRemove(material.id)}
        aria-label={`Remove cost line ${index + 1}`} className={workspace.button}><Trash2 size={14} aria-hidden="true" /></button>}
    </div>
    <div className={styles.materialFields}>
      <label className={styles.field}>Catalog Item *
        <input data-search-field="true" list={`catalog-${material.id}`} value={material.searchInput} onChange={event => handleMaterialName(event.target.value)}
          disabled={disabled} placeholder="Search or enter a cost item" aria-invalid={Boolean(errors.searchInput)} />
        <datalist id={`catalog-${material.id}`}>{materials.map(entry => <option key={entry.materialId} value={entry.materialName} />)}</datalist>
        {errors.searchInput && <span className={styles.error}>{errors.searchInput}</span>}
      </label>
      <div className={styles.numbers}>
        <label className={styles.field}>Unit *
          <select value={material.catalogItemId} onChange={event => onSelectUnitType(material.id, event.target.value)} disabled={disabled} aria-invalid={Boolean(errors.unitType)}>
            <option value="">Select unit</option>{units.map(unit => <option key={unit.catalogItemId} value={unit.catalogItemId}>{unit.unitType}</option>)}
          </select>
          {errors.unitType && <span className={styles.error}>{errors.unitType}</span>}
        </label>
        <label className={styles.field}>Quantity *
          <input value={material.quantityInput} onChange={event => onFieldChange(material.id, "quantityInput", event.target.value)}
            disabled={disabled} inputMode="decimal" placeholder="0" aria-invalid={Boolean(errors.quantityInput)} />
          {errors.quantityInput && <span className={styles.error}>{errors.quantityInput}</span>}
        </label>
        <label className={styles.field}>Unit Cost
          <input value={formatBudgetNumberForInput(parseBudgetNumberInput(material.unitCostInput))}
            onChange={event => onFieldChange(material.id, "unitCostInput", event.target.value)} disabled={disabled} inputMode="decimal" placeholder="0" />
        </label>
      </div>
      <label className={styles.field}>Pricing Basis
        <select value={material.pricingBasis} onChange={event => onFieldChange(material.id, "pricingBasis", event.target.value)} disabled={disabled}>
          <option value="catalog">Catalog / reference rate</option><option value="supplier_quote">Supplier quotation</option>
        </select>
      </label>
      {material.pricingBasis === "supplier_quote" && <div className={styles.quoteFields}>
        <QuoteField label="Supplier" value={material.referenceSupplier} error={errors.referenceSupplier} disabled={disabled} onChange={value => onFieldChange(material.id, "referenceSupplier", value)} />
        <QuoteField label="Quotation Reference" value={material.referenceQuotation} error={errors.referenceQuotation} disabled={disabled} onChange={value => onFieldChange(material.id, "referenceQuotation", value)} />
      </div>}
    </div>
    <div className={styles.lineTotal}><span>Line Total</span><strong>{formatBudgetMoney(lineTotal)}</strong></div>
  </div>;
}

function QuoteField({ label, value, error, disabled, onChange }: { label: string; value: string; error?: string; disabled: boolean; onChange: (value: string) => void }) {
  return <label className={styles.field}>{label} *
    <input value={value} onChange={event => onChange(event.target.value)} disabled={disabled} aria-invalid={Boolean(error)} />
    {error && <span className={styles.error}>{error}</span>}
  </label>;
}
