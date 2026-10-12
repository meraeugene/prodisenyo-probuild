"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatBudgetNumberForInput,
} from "@/features/cost-estimator/utils/costEstimatorFormatters";
import type {
  CostEstimatorItemModalProps,
} from "@/features/cost-estimator/types";

import MaterialFields from "./CostEstimatorMaterialFields";

type Props = Pick<
  CostEstimatorItemModalProps,
  | "form"
  | "errors"
  | "materials"
  | "itemNumberLabel"
  | "readOnly"
  | "pending"
  | "onFieldChange"
  | "onSelectMaterial"
  | "onSelectUnitType"
  | "onMaterialRowFieldChange"
  | "onAddMaterial"
  | "onRemoveMaterial"
>;

export default function CostEstimatorItemFields(props: Props) {
  const disabled = Boolean(props.readOnly || props.pending);
  const allUnits = Array.from(
    new Map(
      props.materials
        .flatMap((material) => material.units)
        .map((unit) => [unit.unitType.toLowerCase(), unit]),
    ).values(),
  ).sort((left, right) => left.unitType.localeCompare(right.unitType));
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_190px]">
        <label className="block text-sm font-semibold text-slate-800">
          Section / Category <span className="text-rose-500">*</span>
          <input
            list="boq-section-options"
            value={props.form.section}
            onChange={(event) =>
              props.onFieldChange("section", event.target.value)
            }
            disabled={disabled}
            placeholder="e.g. Structural Works"
            className={cn(
              "mt-2 h-9 w-full rounded-[9px] border bg-white px-3 text-sm font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100",
              props.errors.section ? "border-rose-300" : "border-slate-200",
            )}
          />
          <datalist id="boq-section-options">
            <option value="General Requirements" />
            <option value="Site Works" />
            <option value="Structural Works" />
            <option value="Architectural / Finishing" />
            <option value="Mechanical Works" />
            <option value="Electrical Works" />
            <option value="Plumbing Works" />
          </datalist>
          {props.errors.section ? (
            <span className="mt-1 block text-xs font-medium text-rose-600">
              {props.errors.section}
            </span>
          ) : null}
        </label>
        <label className="block text-sm font-semibold text-slate-800">
          Item No. <span className="text-rose-500">*</span>
          <input
            value={props.form.itemNumber}
            onChange={(event) =>
              props.onFieldChange("itemNumber", event.target.value)
            }
            disabled={disabled}
            placeholder={props.itemNumberLabel}
            className={cn(
              "mt-2 h-9 w-full rounded-[9px] border bg-white px-3 text-sm font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100",
              props.errors.itemNumber
                ? "border-rose-300"
                : "border-slate-200",
            )}
          />
          {props.errors.itemNumber ? (
            <span className="mt-1 block text-xs font-medium text-rose-600">
              {props.errors.itemNumber}
            </span>
          ) : null}
        </label>
      </div>

      <label className="block text-sm font-semibold text-slate-800">
        Description <span className="text-rose-500">*</span>
        <input
          value={props.form.displayName}
          onChange={(event) =>
            props.onFieldChange("displayName", event.target.value)
          }
          disabled={disabled}
          placeholder="Describe this BOQ item"
          className={cn(
            "mt-2 h-9 w-full rounded-[9px] border bg-white px-3 text-sm font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100",
            props.errors.displayName ? "border-rose-300" : "border-slate-200",
          )}
        />
        {props.errors.displayName ? (
          <span className="mt-1 block text-xs font-medium text-rose-600">
            {props.errors.displayName}
          </span>
        ) : null}
      </label>

      <div className="space-y-4">
        {props.form.materials.map((material, index) => (
          <MaterialFields
            key={material.id}
            material={material}
            index={index}
            canRemove={props.form.materials.length > 1}
            materials={props.materials}
            allUnits={allUnits}
            errors={props.errors.materialRows[material.id] ?? {}}
            disabled={disabled}
            onSelectMaterial={props.onSelectMaterial}
            onSelectUnitType={props.onSelectUnitType}
            onFieldChange={props.onMaterialRowFieldChange}
            onRemove={props.onRemoveMaterial}
          />
        ))}
      </div>

      {!props.readOnly ? (
        <button
          type="button"
          onClick={props.onAddMaterial}
          disabled={props.pending}
          className="inline-flex h-10 items-center gap-2 rounded-[9px] border border-teal-700 px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-60"
        >
          <Plus aria-hidden="true" size={16} /> Add another cost line
        </button>
      ) : null}

      <label className="block text-sm font-semibold text-slate-800">
        Notes <span className="font-normal text-slate-500">(optional)</span>
        <textarea
          value={props.form.notes}
          onChange={(event) => props.onFieldChange("notes", event.target.value)}
          disabled={disabled}
          maxLength={500}
          rows={3}
          placeholder="Add details for this BOQ item..."
          className="mt-2 w-full resize-y rounded-[9px] border border-slate-200 bg-white p-3 text-sm font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
        <span className="mt-1 block text-right text-xs font-normal text-slate-500">
          {props.form.notes.length} / 500
        </span>
      </label>
    </div>
  );
}
