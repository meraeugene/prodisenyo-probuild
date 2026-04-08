"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  MoreHorizontal,
  Plus,
  SquarePen,
  Trash2,
  X,
} from "lucide-react";
import {
  formatBudgetMoney,
  parseBudgetNumberInput,
  sanitizeBudgetNumericInput,
} from "@/features/cost-estimator/utils/costEstimatorFormatters";
import type {
  EstimateItemModalForm,
  MaterialOptionGroup,
} from "@/features/cost-estimator/types";

export default function CostEstimatorItemModal({
  open,
  form,
  materials,
  computedTotal,
  editing,
  readOnly,
  pending,
  onClose,
  onSelectMaterial,
  onSelectUnitType,
  onFieldChange,
  onMaterialRowFieldChange,
  onAddMaterial,
  onSaveMaterial,
  onEditMaterial,
  onRemoveMaterial,
  onSave,
  onDelete,
}: {
  open: boolean;
  form: EstimateItemModalForm;
  materials: MaterialOptionGroup[];
  computedTotal: number;
  editing: boolean;
  readOnly?: boolean;
  pending: boolean;
  onClose: () => void;
  onSelectMaterial: (materialRowId: string, materialId: string) => void;
  onSelectUnitType: (materialRowId: string, catalogItemId: string) => void;
  onFieldChange: (
    field: Exclude<keyof EstimateItemModalForm, "materials" | "id">,
    value: string,
  ) => void;
  onMaterialRowFieldChange: (
    materialRowId: string,
    field: "searchInput" | "unitCostInput" | "quantityInput",
    value: string,
  ) => void;
  onAddMaterial: () => void;
  onSaveMaterial: (materialRowId: string) => void;
  onEditMaterial: (materialRowId: string) => void;
  onRemoveMaterial: (materialRowId: string) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const [openMaterialMenuId, setOpenMaterialMenuId] = useState<string | null>(null);
  const [openUnitMenuId, setOpenUnitMenuId] = useState<string | null>(null);
  const [openReceiptMenuId, setOpenReceiptMenuId] = useState<string | null>(null);

  const materialsById = useMemo(
    () => new Map(materials.map((material) => [material.materialId, material])),
    [materials],
  );
  const allUnitOptions = useMemo(() => {
    const seen = new Set<string>();

    return materials
      .flatMap((material) => material.units)
      .filter((unit) => {
        const key = unit.unitType.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((left, right) => left.unitType.localeCompare(right.unitType));
  }, [materials]);

  const savedMaterials = form.materials.filter((material) => material.saved);
  const editingMaterials = form.materials.filter((material) => !material.saved);
  const receiptMaterials = form.materials;
  const activeEditingMaterial = editingMaterials[0] ?? null;
  const activeEditingMaterialId = activeEditingMaterial?.id ?? null;
  const isReadOnly = Boolean(readOnly);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] bg-black/40 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative mx-auto flex h-[min(92vh,920px)] w-full max-w-7xl flex-col overflow-hidden rounded-[28px] border border-apple-mist bg-[#f8fbf8] shadow-[0_28px_90px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between border-b border-apple-mist bg-white px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
              Engineer Cost
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-apple-charcoal">
              {editing ? "Update Cost" : "Add Cost"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-apple-mist text-apple-smoke transition hover:bg-apple-mist/40"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className={
            isReadOnly
              ? "grid h-full min-h-0 flex-1"
              : "grid h-full min-h-0 flex-1 xl:grid-cols-[320px_minmax(0,1fr)_380px]"
          }
        >
          {isReadOnly ? null : (
            <section className="flex h-full min-h-0 flex-col border-b border-apple-mist bg-[rgb(var(--apple-snow))] px-6 py-5 xl:border-b-0 xl:border-r">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
              Cost details
            </p>
            <label className="mt-4 mb-2 block text-sm font-semibold text-apple-charcoal">
              Description <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.displayName}
              onChange={(event) => onFieldChange("displayName", event.target.value)}
              placeholder="e.g. Tiles, kitchen cabinets, window glass set"
              disabled={isReadOnly}
              className="w-full rounded-[12px] border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-3 text-sm outline-none focus:border-[#1f6a37]"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onAddMaterial}
                disabled={editingMaterials.length > 0 || isReadOnly}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#1f6a37] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#18552d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={16} />
                {form.materials.length === 0
                  ? "Add material"
                  : editingMaterials.length > 0
                    ? "Finish current material first"
                    : "Add another material"}
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                {savedMaterials.length} saved
              </span>
              <span className="inline-flex items-center rounded-full border border-apple-mist bg-white px-3 py-1 text-xs font-semibold text-apple-steel">
                {editingMaterials.length} in progress
              </span>
            </div>

            <div className="mt-5 flex min-h-0 flex-1 flex-col rounded-[22px] border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.05)]">
              <label className="mb-2 block text-sm font-semibold text-apple-charcoal">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(event) => onFieldChange("notes", event.target.value)}
                placeholder="Add notes like brand, dimensions, color, supplier, or special installation details."
                disabled={isReadOnly}
                className="min-h-[180px] flex-1 resize-none rounded-[12px] border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-3 text-sm outline-none focus:border-[#1f6a37]"
              />
            </div>

            </section>
          )}

          <section
            className={
              isReadOnly
                ? "flex h-full min-h-0 flex-col bg-white px-6 py-5"
                : "flex h-full min-h-0 flex-col border-b border-apple-mist bg-white px-6 py-5 xl:border-b-0 xl:border-r"
            }
          >
            {isReadOnly ? (
              <div className="flex h-full min-h-0 flex-col rounded-[22px] border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.06)]">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
                    Item materials
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-apple-charcoal">
                    {form.displayName || "Item description"}
                  </h3>
                </div>

                <div className="mt-5 min-h-0 flex-1 overflow-auto rounded-[16px] border border-apple-mist">
                  <div className="grid grid-cols-[minmax(180px,1.4fr)_90px_90px_120px] gap-2 border-b border-apple-mist bg-[rgb(var(--apple-snow))] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-apple-steel">
                    <span>Description</span>
                    <span>Unit</span>
                    <span>Qty</span>
                    <span>Unit cost</span>
                  </div>

                  <div className="divide-y divide-apple-mist">
                    {form.materials.map((material) => {
                      const quantityValue = parseBudgetNumberInput(
                        material.quantityInput || "0",
                      );
                      const unitCostValue = parseBudgetNumberInput(
                        material.unitCostInput || "0",
                      );

                      return (
                        <div
                          key={material.id}
                          className="grid grid-cols-[minmax(180px,1.4fr)_90px_90px_120px] gap-2 px-3 py-3 text-sm text-apple-charcoal"
                        >
                          <span className="truncate font-semibold">
                            {material.materialName || material.searchInput || "Material"}
                          </span>
                          <span>{material.unitType || "-"}</span>
                          <span>{quantityValue || 0}</span>
                          <span>{formatBudgetMoney(unitCostValue)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-[16px] border border-emerald-100 bg-emerald-50 px-4 py-4">
                  <span className="text-sm font-semibold text-emerald-900">Total estimate</span>
                  <span className="text-lg font-semibold text-emerald-900">
                    {formatBudgetMoney(computedTotal)}
                  </span>
                </div>
              </div>
            ) : activeEditingMaterial ? (() => {
              const materialRow = activeEditingMaterial;
              const selectedMaterial =
                materialsById.get(materialRow.materialId) ?? null;
              const materialNumber =
                form.materials.findIndex((entry) => entry.id === materialRow.id) + 1;
              const filteredMaterials = materials.filter((material) => {
                const query = materialRow.searchInput.trim().toLowerCase();
                if (!query) return true;
                return material.searchText.includes(query);
              });
              const materialTotal =
                parseBudgetNumberInput(materialRow.unitCostInput || "0") *
                parseBudgetNumberInput(materialRow.quantityInput || "0");

              return (
                <div className="flex h-full min-h-0 w-full flex-col rounded-[22px] border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.06)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
                        Material {materialNumber}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-apple-charcoal">
                        {materialRow.materialName || materialRow.searchInput || "New Material"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveMaterial(materialRow.id)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-rose-200 text-rose-700 transition hover:bg-rose-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-5 flex min-h-0 flex-1 flex-col gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-apple-charcoal">
                        Material Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          value={materialRow.searchInput}
                          onFocus={() => setOpenMaterialMenuId(materialRow.id)}
                          onChange={(event) => {
                            const value = event.target.value;
                            onMaterialRowFieldChange(materialRow.id, "searchInput", value);
                            setOpenMaterialMenuId(materialRow.id);
                            const matchedMaterial = materials.find(
                              (material) =>
                                material.materialName.toLowerCase() ===
                                value.trim().toLowerCase(),
                            );
                            if (matchedMaterial) {
                              onSelectMaterial(materialRow.id, matchedMaterial.materialId);
                            }
                          }}
                          onBlur={() => {
                            window.setTimeout(() => {
                              setOpenMaterialMenuId((current) =>
                                current === materialRow.id ? null : current,
                              );
                            }, 120);
                          }}
                          placeholder="Search existing material or type a new one"
                          disabled={isReadOnly}
                          className="w-full rounded-[12px] border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-3 text-sm outline-none focus:border-[#1f6a37]"
                        />

                        {openMaterialMenuId === materialRow.id && filteredMaterials.length > 0 ? (
                          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-72 overflow-y-auto rounded-[14px] border border-apple-mist bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                            {filteredMaterials.map((material, index) => {
                              const materialCost = material.units[0]?.unitCost ?? 0;
                              return (
                                <button
                                  key={`${material.materialId}:${material.materialName}:${index}`}
                                  type="button"
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    onSelectMaterial(materialRow.id, material.materialId);
                                    setOpenMaterialMenuId(null);
                                  }}
                                  className="flex w-full items-center justify-between gap-4 border-b border-apple-mist px-4 py-3 text-left text-sm transition last:border-b-0 hover:bg-emerald-50"
                                >
                                  <span className="min-w-0 flex-1 truncate font-medium text-apple-charcoal">
                                    {material.materialName}
                                  </span>
                                  <span className="shrink-0 font-semibold text-[#1f6a37]">
                                    {formatBudgetMoney(materialCost)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-apple-charcoal">
                        Unit Type <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className="relative"
                        onBlur={() => {
                          window.setTimeout(() => {
                            setOpenUnitMenuId((current) =>
                              current === materialRow.id ? null : current,
                            );
                          }, 120);
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenUnitMenuId((current) =>
                              current === materialRow.id ? null : materialRow.id,
                            )
                          }
                          disabled={isReadOnly}
                          className="flex w-full items-center justify-between rounded-[12px] border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-3 text-left text-sm outline-none transition focus:border-[#1f6a37]"
                        >
                          <span className={materialRow.unitType ? "text-apple-charcoal" : "text-apple-steel"}>
                            {materialRow.unitType || "Select"}
                          </span>
                          <ChevronDown size={16} className="text-apple-steel" />
                        </button>

                        {openUnitMenuId === materialRow.id ? (
                          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-64 overflow-y-auto rounded-[14px] border border-apple-mist bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                            {(selectedMaterial?.units ?? allUnitOptions).map((unit) => (
                              <button
                                key={unit.optionId}
                                type="button"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  onSelectUnitType(materialRow.id, unit.catalogItemId);
                                  setOpenUnitMenuId(null);
                                }}
                                className="flex w-full items-center justify-between gap-4 border-b border-apple-mist px-4 py-3 text-left text-sm transition last:border-b-0 hover:bg-emerald-50"
                              >
                                <span className="font-medium text-apple-charcoal">
                                  {unit.unitType}
                                </span>
                                <span className="shrink-0 font-semibold text-[#1f6a37]">
                                  {formatBudgetMoney(unit.unitCost)}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-apple-charcoal">
                          Unit Cost
                        </label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-apple-steel">
                            P
                          </span>
                          <input
                            value={materialRow.unitCostInput}
                            onChange={(event) =>
                              onMaterialRowFieldChange(
                                materialRow.id,
                                "unitCostInput",
                                event.target.value,
                              )
                            }
                            placeholder="0"
                            inputMode="decimal"
                            disabled={isReadOnly}
                            className="w-full rounded-[12px] border border-apple-mist bg-[rgb(var(--apple-snow))] px-9 py-3 text-sm outline-none focus:border-[#1f6a37]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-apple-charcoal">
                          Quantity <span className="text-rose-500">*</span>
                        </label>
                        <input
                          value={materialRow.quantityInput}
                          onChange={(event) =>
                            onMaterialRowFieldChange(
                              materialRow.id,
                              "quantityInput",
                              event.target.value,
                            )
                          }
                          placeholder="1"
                          inputMode="decimal"
                          disabled={isReadOnly}
                          className="w-full rounded-[12px] border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-3 text-sm outline-none focus:border-[#1f6a37]"
                        />
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 rounded-[16px] border border-emerald-100 bg-emerald-50 px-4 py-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                          Material total
                        </p>
                        <p className="mt-2 text-xl font-semibold text-emerald-900">
                          {formatBudgetMoney(materialTotal)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSaveMaterial(materialRow.id)}
                        disabled={isReadOnly}
                        className="inline-flex items-center gap-2 rounded-[12px] bg-[#1f6a37] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#18552d]"
                      >
                        <Check size={14} />
                        Save Material
                      </button>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="flex min-h-[340px] items-center justify-center rounded-[20px] border border-dashed border-apple-mist bg-white px-6 text-center">
                <p className="text-base font-semibold text-apple-charcoal">
                  Add a material to begin
                </p>
              </div>
            )}
          </section>

          {isReadOnly ? null : (
            <aside className="flex h-full min-h-0 flex-col bg-[#f8fbf8] px-6 py-5">
              <div className="flex min-h-0 flex-1 flex-col rounded-[20px] border border-emerald-100 bg-emerald-50 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                  Total estimate
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-emerald-900">
                  {formatBudgetMoney(computedTotal)}
                </p>

                <div className="mt-5 min-h-0 flex-1 overflow-y-auto border-t border-emerald-200/70 pt-4 pr-4">
                  {receiptMaterials.length === 0 ? (
                    <p className="text-sm text-emerald-900/75">No saved materials yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {receiptMaterials.map((material) => {
                        const materialTotal =
                          parseBudgetNumberInput(material.unitCostInput || "0") *
                          parseBudgetNumberInput(material.quantityInput || "0");

                        return (
                          <div
                            key={material.id}
                            className="border-b border-emerald-200/70 pb-3 last:border-b-0 last:pb-0"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-apple-charcoal">
                                  {material.materialName}
                                </p>
                                <p className="mt-1 text-xs text-apple-steel">
                                  {material.unitType || "No unit"} |{" "}
                                  {material.quantityInput || "0"}
                                </p>
                              </div>
                              <p className="shrink-0 text-sm font-semibold text-[#1f6a37]">
                                {formatBudgetMoney(materialTotal)}
                              </p>
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-3">
                              {!material.saved ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                                  Editing
                                </span>
                              ) : (
                                <span />
                              )}

                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenReceiptMenuId((current) =>
                                      current === material.id ? null : material.id,
                                    )
                                  }
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-apple-mist text-apple-smoke transition hover:bg-apple-mist/40"
                                >
                                  <MoreHorizontal size={16} />
                                </button>

                                {openReceiptMenuId === material.id ? (
                                  <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-36 overflow-hidden rounded-[12px] border border-apple-mist bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                                    <button
                                      type="button"
                                      onMouseDown={(event) => {
                                        event.preventDefault();
                                        setOpenReceiptMenuId(null);
                                        onEditMaterial(material.id);
                                      }}
                                      disabled={!material.saved}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-apple-charcoal transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-apple-steel"
                                    >
                                      <SquarePen size={14} />
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onMouseDown={(event) => {
                                        event.preventDefault();
                                        setOpenReceiptMenuId(null);
                                        onRemoveMaterial(material.id);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                                    >
                                      <Trash2 size={14} />
                                      Remove
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </aside>
          )}
        </div>

        <div className="border-t border-apple-mist bg-white px-6 py-4">
          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="inline-flex items-center justify-center rounded-[12px] border border-apple-mist px-4 py-3 text-sm font-semibold text-apple-charcoal transition hover:bg-apple-mist/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            {!isReadOnly ? (
              <>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={pending}
                  className="inline-flex items-center justify-center rounded-[12px] bg-[#1f6a37] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending
                    ? editing
                      ? "Updating cost..."
                      : "Adding cost..."
                    : editing
                      ? "Update cost"
                      : "Add cost"}
                </button>

                {editing ? (
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={pending}
                    className="mr-auto inline-flex items-center justify-center gap-2 rounded-[12px] border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
