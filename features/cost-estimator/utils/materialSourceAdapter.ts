import type {
  CostCatalogItemRow,
  MaterialOptionGroup,
  MaterialUnitOption,
} from "@/features/cost-estimator/types";
import {
  KERMIT_MATERIAL_ROWS,
  type KermitMaterialRow,
} from "@/features/cost-estimator/utils/kermitMaterials";

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function buildStableSuffix(value: string) {
  let hash = 0;
  const normalized = normalizeKey(value);

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

export function buildMaterialGroupId(value: string) {
  return normalizeKey(value)
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseWorkbookCost(rawCost: string) {
  const normalized = rawCost.trim();
  const matches = normalized.match(/\d+(?:\.\d+)?/g) ?? [];
  const parsed = matches[0] ? Number(matches[0]) : 0;

  return {
    parsedCost: Number.isFinite(parsed) ? parsed : 0,
    rawCostLabel: normalized || "N/A",
    note:
      normalized.toUpperCase() === "N/A" || matches.length !== 1
        ? `Workbook cost: ${normalized || "N/A"}. Edit if needed for this estimate.`
        : null,
  };
}

export function buildMaterialIdFromName(materialName: string) {
  const slug = buildMaterialGroupId(materialName) || "material";
  return `material:${slug}-${buildStableSuffix(materialName)}`;
}

function buildMaterialSearchText(
  materialName: string,
  units: MaterialUnitOption[],
) {
  return [
    materialName,
    ...units.flatMap((unit) => [unit.unitType, unit.notes ?? ""]),
  ]
    .join(" ")
    .trim()
    .toLowerCase();
}

export function normalizeMaterialOptions(rows: CostCatalogItemRow[]): MaterialOptionGroup[] {
  const groups = new Map<string, MaterialOptionGroup>();

  function upsertMaterial(
    materialName: string,
    unit: MaterialUnitOption,
    materialId: string,
  ) {
    const materialKey = normalizeKey(materialName) || materialId;
    const existing = groups.get(materialKey);

    if (existing) {
      const duplicate = existing.units.some(
        (entry) => normalizeKey(entry.unitType) === normalizeKey(unit.unitType),
      );
      if (!duplicate) {
        existing.units.push(unit);
        existing.searchText = buildMaterialSearchText(existing.materialName, existing.units);
      }
      return;
    }

    groups.set(materialKey, {
      materialId,
      materialName,
      searchText: buildMaterialSearchText(materialName, [unit]),
      units: [unit],
    });
  }

  KERMIT_MATERIAL_ROWS.forEach((row: KermitMaterialRow) => {
    const { parsedCost, rawCostLabel, note } = parseWorkbookCost(row.rawCost);
    const optionId = `sheet:${buildMaterialGroupId(row.materialName)}:${buildMaterialGroupId(row.unitType)}`;
    upsertMaterial(
      row.materialName,
      {
        optionId,
        catalogItemId: optionId,
        unitType: row.unitType,
        unitCost: parsedCost,
        rawCostLabel,
        category: "materials",
        notes: note,
      },
      buildMaterialIdFromName(row.materialName),
    );
  });

  rows
    .filter((row) => row.is_active)
    .forEach((row) => {
      upsertMaterial(
        row.name,
        {
          optionId: row.id,
          catalogItemId: row.id,
          unitType: row.unit_label,
          unitCost: row.unit_cost,
          rawCostLabel: row.unit_cost.toString(),
          category: row.category,
          notes: row.notes,
        },
        buildMaterialIdFromName(row.name),
      );
    });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      units: [...group.units].sort((left, right) =>
        left.unitType.localeCompare(right.unitType),
      ),
      searchText: buildMaterialSearchText(group.materialName, group.units),
    }))
    .sort((left, right) => left.materialName.localeCompare(right.materialName));
}

// Future sheet parser should map arbitrary uploaded columns into this same contract.
export type NormalizedMaterialSource = MaterialOptionGroup[];
