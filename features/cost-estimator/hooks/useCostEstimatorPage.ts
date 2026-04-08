"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteProjectEstimateAction,
  duplicateRejectedEstimateAction,
  saveCostCatalogItemAction,
  saveProjectEstimateDraftAction,
  submitProjectEstimateAction,
} from "@/actions/costEstimator";
import {
  EMPTY_ESTIMATE_FORM,
  EMPTY_ESTIMATE_ITEM_MODAL_FORM,
  type CostCatalogItemRow,
  type EstimateItemModalForm,
  type EstimateItemModalMaterialForm,
  type MaterialOptionGroup,
  type ProjectEstimateDraftForm,
  type ProjectEstimateDraftLine,
  type ProjectEstimateItemRow,
  type ProjectEstimateRow,
} from "@/features/cost-estimator/types";
import {
  buildEstimateDraftForm,
  buildEstimateItemModalForm,
  buildEstimateItemsMap,
  buildInitialModalMaterial,
  ensureEstimateLineTotals,
  sortEstimatesByUpdatedAt,
} from "@/features/cost-estimator/utils/costEstimatorMappers";
import {
  parseBudgetNumberInput,
  sanitizeBudgetNumericInput,
} from "@/features/cost-estimator/utils/costEstimatorFormatters";
import {
  buildMaterialIdFromName,
  normalizeMaterialOptions,
} from "@/features/cost-estimator/utils/materialSourceAdapter";

interface UseCostEstimatorPageOptions {
  estimates: ProjectEstimateRow[];
  items: ProjectEstimateItemRow[];
  catalogItems: CostCatalogItemRow[];
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function buildDisplayName(baseName: string, materialName: string, bundleCount: number) {
  return bundleCount > 1 ? `${baseName} - ${materialName}` : baseName;
}

function setCostEstimatorModalScrollEnabled(enabled: boolean) {
  if (typeof document === "undefined") return;

  [document.body, document.documentElement].forEach((element) => {
    if (enabled) {
      element.classList.add("overflow-hidden");
      element.classList.remove("overflow-y-auto");
    } else {
      element.classList.remove("overflow-hidden");
      element.classList.remove("overflow-y-auto");
    }
  });
}

function validateModalMaterial(
  material: EstimateItemModalMaterialForm,
  materialOptions: ReturnType<typeof normalizeMaterialOptions>,
) {
  const quantityValue = parseBudgetNumberInput(material.quantityInput);
  const unitCostValue = parseBudgetNumberInput(material.unitCostInput);
  const resolvedMaterial =
    materialOptions.find((option) => option.materialId === material.materialId) ?? null;
  const resolvedUnit =
    resolvedMaterial?.units.find((entry) => entry.catalogItemId === material.catalogItemId) ??
    resolvedMaterial?.units[0] ??
    null;

  if (!material.materialName.trim() || !material.unitType.trim()) {
    throw new Error("Select a material and unit type before saving it.");
  }
  if (quantityValue <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }

  return {
    quantityValue,
    unitCostValue,
    resolvedMaterial,
    resolvedUnit,
  };
}

export function useCostEstimatorPage({
  estimates: initialEstimates,
  items: initialItems,
  catalogItems,
}: UseCostEstimatorPageOptions) {
  const initialItemsMap = buildEstimateItemsMap(initialItems);
  const [estimates, setEstimates] = useState(initialEstimates);
  const [itemsByEstimateId, setItemsByEstimateId] = useState(initialItemsMap);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(
    initialEstimates[0]?.id ?? null,
  );
  const [estimateForm, setEstimateForm] = useState<ProjectEstimateDraftForm>(() =>
    buildEstimateDraftForm(
      initialEstimates[0] ?? null,
      initialItemsMap[initialEstimates[0]?.id ?? ""] ?? [],
    ),
  );
  const [projectSetupOpen, setProjectSetupOpen] = useState(
    initialEstimates.length === 0,
  );
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemModalForm, setItemModalForm] = useState<EstimateItemModalForm>(
    EMPTY_ESTIMATE_ITEM_MODAL_FORM,
  );
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [activeReportEstimateId, setActiveReportEstimateId] = useState<string | null>(
    null,
  );
  const [pendingEstimateAction, startEstimateTransition] = useTransition();
  const [pendingDeleteEstimate, setPendingDeleteEstimate] = useState(false);
  const [customMaterialOptions, setCustomMaterialOptions] = useState<MaterialOptionGroup[]>(
    [],
  );

  const materialOptions = useMemo(() => {
    const normalized = normalizeMaterialOptions(catalogItems);
    const merged = [...normalized];

    customMaterialOptions.forEach((customMaterial) => {
      const existing = merged.find(
        (entry) => entry.materialId === customMaterial.materialId,
      );
      if (existing) {
        customMaterial.units.forEach((unit) => {
          const duplicate = existing.units.some(
            (entry) => entry.catalogItemId === unit.catalogItemId,
          );
          if (!duplicate) {
            existing.units.push(unit);
          }
        });
        return;
      }

      merged.push(customMaterial);
    });

    return merged.sort((left, right) => left.materialName.localeCompare(right.materialName));
  }, [catalogItems, customMaterialOptions]);
  const sortedEstimates = useMemo(
    () => sortEstimatesByUpdatedAt(estimates),
    [estimates],
  );
  const selectedEstimate =
    sortedEstimates.find((estimate) => estimate.id === selectedEstimateId) ?? null;
  const activeReportEstimate =
    sortedEstimates.find((estimate) => estimate.id === activeReportEstimateId) ?? null;
  const activeReportItems = activeReportEstimate
    ? itemsByEstimateId[activeReportEstimate.id] ?? []
    : [];
  const isReadOnlyEstimate =
    selectedEstimate !== null && selectedEstimate.status !== "draft";
  const derivedEstimateTotal = useMemo(
    () => round2(estimateForm.items.reduce((sum, item) => sum + item.lineTotal, 0)),
    [estimateForm.items],
  );
  const currentEstimateTotal =
    estimateForm.items.length > 0
      ? derivedEstimateTotal
      : estimateForm.costEstimate;
  const totalQuantity = useMemo(
    () => round2(estimateForm.items.reduce((sum, item) => sum + item.quantity, 0)),
    [estimateForm.items],
  );
  const currentLineTotal = useMemo(
    () =>
      round2(
        itemModalForm.materials.reduce(
          (sum, item) =>
            sum +
            parseBudgetNumberInput(item.unitCostInput) *
              parseBudgetNumberInput(item.quantityInput),
          0,
        ),
      ),
    [itemModalForm.materials],
  );

  function applyEstimateUpdate(
    estimate: ProjectEstimateRow,
    items: ProjectEstimateItemRow[],
  ) {
    setEstimates((current) => {
      const existing = current.some((entry) => entry.id === estimate.id);
      const next = existing
        ? current.map((entry) => (entry.id === estimate.id ? estimate : entry))
        : [estimate, ...current];
      return sortEstimatesByUpdatedAt(next);
    });
    setItemsByEstimateId((current) => ({
      ...current,
      [estimate.id]: items,
    }));
    setSelectedEstimateId(estimate.id);
    setEstimateForm(buildEstimateDraftForm(estimate, items));
    setProjectSetupOpen(false);
  }

  function handleSelectEstimate(estimateId: string) {
    const estimate = sortedEstimates.find((entry) => entry.id === estimateId) ?? null;
    setSelectedEstimateId(estimateId);
    setEstimateForm(
      buildEstimateDraftForm(estimate, itemsByEstimateId[estimateId] ?? []),
    );
    setProjectSetupOpen(false);
  }

  function handleOpenNewProjectSetup() {
    setSelectedEstimateId(null);
    setEstimateForm(EMPTY_ESTIMATE_FORM);
    setProjectSetupOpen(true);
    setItemModalOpen(false);
  }

  function handleCloseProjectSetup() {
    if (selectedEstimate) {
      setEstimateForm(
        buildEstimateDraftForm(
          selectedEstimate,
          itemsByEstimateId[selectedEstimate.id] ?? [],
        ),
      );
      setProjectSetupOpen(false);
      return;
    }

    if (sortedEstimates[0]) {
      handleSelectEstimate(sortedEstimates[0].id);
    }
  }

  function handleEstimateFieldChange(
    field: Exclude<keyof ProjectEstimateDraftForm, "items" | "id">,
    value: string,
  ) {
    setEstimateForm((current) => {
      if (field === "costEstimate") {
        return {
          ...current,
          costEstimate: parseBudgetNumberInput(value),
        };
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  async function persistDraft(shouldSubmit: boolean) {
    const nextForm = ensureEstimateLineTotals(estimateForm);
    const saved = await saveProjectEstimateDraftAction({
      id: nextForm.id,
      projectName: nextForm.projectName,
      projectType: nextForm.projectType,
      costEstimate: nextForm.items.length > 0 ? derivedEstimateTotal : nextForm.costEstimate,
      notes: nextForm.notes,
      items: nextForm.items.map((item) => ({
        id: item.id,
        catalogItemId: item.catalogItemId,
        materialName: item.materialName,
        unitType: item.unitType,
        unitCost: item.unitCost,
        quantity: item.quantity,
        displayName: item.displayName,
        notes: item.notes,
        sortOrder: item.sortOrder,
      })),
    });

    applyEstimateUpdate(saved.estimate, saved.items);

    if (!shouldSubmit) {
      toast.success(nextForm.id ? "Estimate draft updated." : "Project estimate created.");
      return;
    }

    const submitted = await submitProjectEstimateAction(saved.estimate.id);
    applyEstimateUpdate(submitted.estimate, submitted.items);
    toast.success("Estimate submitted for CEO review.");
  }

  function handleSaveEstimate() {
    startEstimateTransition(async () => {
      try {
        await persistDraft(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save estimate.",
        );
      }
    });
  }

  function handleSubmitEstimate() {
    startEstimateTransition(async () => {
      try {
        await persistDraft(true);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to submit estimate.",
        );
      }
    });
  }

  function handleDeleteEstimate() {
    if (!selectedEstimate) return;

    setPendingDeleteEstimate(true);
    startEstimateTransition(async () => {
      try {
        await deleteProjectEstimateAction(selectedEstimate.id);
        setEstimates((current) =>
          current.filter((estimate) => estimate.id !== selectedEstimate.id),
        );
        setItemsByEstimateId((current) => {
          const { [selectedEstimate.id]: _removed, ...rest } = current;
          return rest;
        });
        const nextEstimate = sortedEstimates.find(
          (estimate) => estimate.id !== selectedEstimate.id,
        );
        if (nextEstimate) {
          setSelectedEstimateId(nextEstimate.id);
          setEstimateForm(
            buildEstimateDraftForm(
              nextEstimate,
              itemsByEstimateId[nextEstimate.id] ?? [],
            ),
          );
          setProjectSetupOpen(false);
        } else {
          setSelectedEstimateId(null);
          setEstimateForm(EMPTY_ESTIMATE_FORM);
          setProjectSetupOpen(true);
        }
        toast.success("Estimate deleted.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete estimate.",
        );
      } finally {
        setPendingDeleteEstimate(false);
      }
    });
  }

  function handleDuplicateRejectedEstimate() {
    if (!selectedEstimate) return;

    startEstimateTransition(async () => {
      try {
        const duplicated = await duplicateRejectedEstimateAction(selectedEstimate.id);
        applyEstimateUpdate(duplicated.estimate, duplicated.items);
        toast.success("Rejected estimate copied into a new draft.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to duplicate estimate.",
        );
      }
    });
  }

  function handleOpenAddCostModal(index?: number) {
    setCostEstimatorModalScrollEnabled(true);

    const nextItem = typeof index === "number" ? estimateForm.items[index] ?? null : null;

    if (nextItem) {
      setItemModalForm(buildEstimateItemModalForm(nextItem));
      setEditingItemIndex(index ?? null);
      setItemModalOpen(true);
      return;
    }

    setItemModalForm({
      ...EMPTY_ESTIMATE_ITEM_MODAL_FORM,
      displayName: "",
      materials: [],
    });
    setEditingItemIndex(null);
    setItemModalOpen(true);
  }

  function handleCloseAddCostModal() {
    setCostEstimatorModalScrollEnabled(false);
    setItemModalOpen(false);
    setEditingItemIndex(null);
    setItemModalForm(EMPTY_ESTIMATE_ITEM_MODAL_FORM);
  }

  function findMaterial(materialId: string) {
    return materialOptions.find((option) => option.materialId === materialId) ?? null;
  }

  function updateModalMaterial(
    materialRowId: string,
    updater: (current: EstimateItemModalMaterialForm) => EstimateItemModalMaterialForm,
  ) {
    setItemModalForm((current) => ({
      ...current,
      materials: current.materials.map((material) =>
        material.id === materialRowId ? updater(material) : material,
      ),
    }));
  }

  function handleSelectMaterial(materialRowId: string, materialId: string) {
    const material = findMaterial(materialId);
    const unit = material?.units[0] ?? null;

    updateModalMaterial(materialRowId, (current) => ({
      ...current,
      searchInput: material?.materialName ?? current.searchInput,
      materialId: material?.materialId ?? "",
      materialName: material?.materialName ?? "",
      catalogItemId: unit?.catalogItemId ?? "",
      unitType: unit?.unitType ?? "",
      rawCostLabel: unit?.rawCostLabel ?? "N/A",
      unitCostInput: unit ? unit.unitCost.toString() : "",
    }));
  }

  function handleSelectMaterialUnit(materialRowId: string, catalogItemId: string) {
    const currentMaterial = itemModalForm.materials.find((item) => item.id === materialRowId);
    const material = findMaterial(currentMaterial?.materialId ?? "");
    const allUnits = materialOptions.flatMap((entry) => entry.units);
    const unit = material
      ? material.units.find((entry) => entry.catalogItemId === catalogItemId) ??
        material.units[0] ??
        null
      : allUnits.find((entry) => entry.catalogItemId === catalogItemId) ?? null;

    updateModalMaterial(materialRowId, (current) => ({
      ...current,
      catalogItemId: unit?.catalogItemId ?? "",
      unitType: unit?.unitType ?? current.unitType,
      rawCostLabel: unit?.rawCostLabel ?? current.rawCostLabel,
      unitCostInput:
        current.materialId && unit ? unit.unitCost.toString() : current.unitCostInput,
    }));
  }

  function handleItemModalFieldChange(
    field: Exclude<keyof EstimateItemModalForm, "materials" | "id">,
    value: string,
  ) {
    setItemModalForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleMaterialRowFieldChange(
    materialRowId: string,
    field: "searchInput" | "unitCostInput" | "quantityInput",
    value: string,
  ) {
    updateModalMaterial(materialRowId, (current) => ({
      ...current,
      ...(field === "searchInput"
        ? {
            searchInput: value,
            materialId: "",
            materialName: "",
            catalogItemId: "",
          }
        : {
            [field]: sanitizeBudgetNumericInput(value),
          }),
    }));
  }

  function handleAddModalMaterial() {
    setItemModalForm((current) => ({
      ...current,
      materials: [...current.materials, buildInitialModalMaterial(materialOptions)],
    }));
  }

  function handleSaveModalMaterial(materialRowId: string) {
    startEstimateTransition(async () => {
      try {
        const material = itemModalForm.materials.find((entry) => entry.id === materialRowId);
        if (!material) return;

        const quantityValue = parseBudgetNumberInput(material.quantityInput);
        const unitCostValue = parseBudgetNumberInput(material.unitCostInput);

        if (!material.searchInput.trim()) {
          throw new Error("Material name is required.");
        }
        if (!material.unitType.trim()) {
          throw new Error("Select a unit type before saving the material.");
        }
        if (quantityValue <= 0) {
          throw new Error("Quantity must be greater than zero.");
        }

        if (!material.materialId) {
          const result = await saveCostCatalogItemAction({
            name: material.searchInput.trim(),
            category: "materials",
            unitLabel: material.unitType,
            unitCost: unitCostValue,
            notes: "Added from cost estimator",
          });

          const customOption: MaterialOptionGroup = {
            materialId: buildMaterialIdFromName(result.catalogItem.name),
            materialName: result.catalogItem.name,
            searchText: `${result.catalogItem.name} ${result.catalogItem.unit_label}`.toLowerCase(),
            units: [
              {
                optionId: result.catalogItem.id,
                catalogItemId: result.catalogItem.id,
                unitType: result.catalogItem.unit_label,
                unitCost: result.catalogItem.unit_cost,
                rawCostLabel: result.catalogItem.unit_cost.toString(),
                category: result.catalogItem.category,
                notes: result.catalogItem.notes,
              },
            ],
          };

          setCustomMaterialOptions((current) => {
            const withoutDuplicate = current.filter(
              (entry) => entry.materialName.toLowerCase() !== customOption.materialName.toLowerCase(),
            );
            return [...withoutDuplicate, customOption];
          });

          updateModalMaterial(materialRowId, (current) => ({
            ...current,
            saved: true,
            searchInput: result.catalogItem.name,
            materialId: customOption.materialId,
            materialName: result.catalogItem.name,
            catalogItemId: result.catalogItem.id,
            unitType: result.catalogItem.unit_label,
            rawCostLabel: result.catalogItem.unit_cost.toString(),
            unitCostInput: result.catalogItem.unit_cost.toString(),
          }));

          toast.success("New material saved to the materials list.");
          return;
        }

        const { resolvedMaterial, resolvedUnit } = validateModalMaterial(
          material,
          materialOptions,
        );

        updateModalMaterial(materialRowId, (current) => ({
          ...current,
          saved: true,
          materialName: current.materialName || resolvedMaterial?.materialName || current.searchInput,
          unitType: current.unitType || resolvedUnit?.unitType || "",
        }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save material.");
      }
    });
  }

  function handleEditModalMaterial(materialRowId: string) {
    setItemModalForm((current) => {
      const hasTarget = current.materials.some((material) => material.id === materialRowId);

      if (!hasTarget) {
        return current;
      }

      return {
        ...current,
        materials: current.materials.map((material) => ({
          ...material,
          saved: material.id === materialRowId ? false : true,
        })),
      };
    });
  }

  function handleRemoveModalMaterial(materialRowId: string) {
    setItemModalForm((current) => ({
      ...current,
      materials: current.materials.filter((material) => material.id !== materialRowId),
    }));
  }

  function handleSaveItem() {
    try {
      if (!itemModalForm.displayName.trim()) {
        toast.error("What is this cost for is required.");
        return;
      }
      if (itemModalForm.materials.length === 0) {
        toast.error("Add at least one material.");
        return;
      }
      if (itemModalForm.materials.some((material) => !material.saved)) {
        toast.error("Save each material first before adding this cost.");
        return;
      }

      const nextItems = itemModalForm.materials.map((material, index) => {
        const { quantityValue, unitCostValue, resolvedMaterial, resolvedUnit } =
          validateModalMaterial(material, materialOptions);

        return {
          id: editingItemIndex !== null && index === 0 ? itemModalForm.id : undefined,
          catalogItemId: material.catalogItemId,
          materialId: resolvedMaterial?.materialId ?? material.materialId,
          materialName: material.materialName || resolvedMaterial?.materialName || "",
          unitType: material.unitType || resolvedUnit?.unitType || "",
          unitCost: unitCostValue,
          quantity: quantityValue,
          lineTotal: round2(quantityValue * unitCostValue),
          displayName: buildDisplayName(
            itemModalForm.displayName.trim(),
            material.materialName || resolvedMaterial?.materialName || "Material",
            itemModalForm.materials.length,
          ),
          notes: itemModalForm.notes,
          sortOrder:
            editingItemIndex !== null
              ? editingItemIndex + index
              : estimateForm.items.length + index,
        } satisfies ProjectEstimateDraftLine;
      });

      setEstimateForm((current) => {
        const baseItems =
          editingItemIndex === null
            ? current.items
            : current.items.filter((_, index) => index !== editingItemIndex);

        const insertionIndex =
          editingItemIndex === null ? baseItems.length : editingItemIndex;
        const mergedItems = [
          ...baseItems.slice(0, insertionIndex),
          ...nextItems,
          ...baseItems.slice(insertionIndex),
        ].map((item, index) => ({
          ...item,
          sortOrder: index,
        }));

        return ensureEstimateLineTotals({
          ...current,
          items: mergedItems,
        });
      });
      handleCloseAddCostModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save cost.");
    }
  }

  function handleRemoveItem(index: number) {
    setEstimateForm((current) =>
      ensureEstimateLineTotals({
        ...current,
        items: current.items
          .filter((_, itemIndex) => itemIndex !== index)
          .map((item, itemIndex) => ({
            ...item,
            sortOrder: itemIndex,
          })),
      }),
    );
  }

  return {
    sortedEstimates,
    selectedEstimate,
    estimateForm,
    projectSetupOpen,
    isReadOnlyEstimate,
    itemModalOpen,
    itemModalForm,
    materialOptions,
    currentLineTotal,
    currentEstimateTotal,
    totalQuantity,
    pendingEstimateAction,
    pendingDeleteEstimate,
    activeReportEstimate,
    activeReportItems,
    handleSelectEstimate,
    handleOpenNewProjectSetup,
    handleCloseProjectSetup,
    handleEstimateFieldChange,
    handleSaveEstimate,
    handleSubmitEstimate,
    handleDeleteEstimate,
    handleDuplicateRejectedEstimate,
    handleOpenAddCostModal,
    handleCloseAddCostModal,
    handleSelectMaterial,
    handleSelectMaterialUnit,
    handleItemModalFieldChange,
    handleMaterialRowFieldChange,
    handleAddModalMaterial,
    handleSaveModalMaterial,
    handleEditModalMaterial,
    handleRemoveModalMaterial,
    handleSaveItem,
    handleRemoveItem,
    setActiveReportEstimateId,
  };
}
