import { BUDGET_ITEM_CATEGORY_OPTIONS } from "@/features/budget-tracker/types";
import type { BudgetItemCategory } from "@/types/database";

export function formatBudgetMoney(value: number, currencyCode = "PHP"): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatBudgetNumberForInput(value: number): string {
  if (!value) return "";
  const [whole, fraction] = value.toString().split(".");
  const formattedWhole = new Intl.NumberFormat("en-US").format(Number(whole));
  return fraction ? `${formattedWhole}.${fraction}` : formattedWhole;
}

export function sanitizeBudgetNumericInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole = "", ...fractionParts] = cleaned.split(".");
  const normalizedWhole = whole.replace(/^0+(?=\d)/, "") || (whole ? "0" : "");
  const formattedWhole = normalizedWhole
    ? new Intl.NumberFormat("en-US").format(Number(normalizedWhole))
    : "";
  const fraction = fractionParts.join("");
  if (cleaned.includes(".")) {
    return `${formattedWhole || "0"}.${fraction}`;
  }
  return formattedWhole;
}

export function parseBudgetNumberInput(value: string): number {
  const normalized = value.replace(/,/g, "").trim();
  const amount = Number(normalized || 0);
  return Number.isFinite(amount) && amount > 0
    ? Math.round(amount * 100) / 100
    : 0;
}

export function getBudgetCategoryLabel(value: BudgetItemCategory): string {
  return (
    BUDGET_ITEM_CATEGORY_OPTIONS.find((option) => option.value === value)
      ?.label ?? value
  );
}

export function getBudgetCategoryColorClasses(value: BudgetItemCategory): {
  badge: string;
  text: string;
  bar: string;
  cardBg: string;
  cardHoverBorder: string;
  cardActiveBg: string;
} {
  switch (value) {
    case "materials":
      return {
        badge: "bg-emerald-50 text-emerald-700",
        text: "text-emerald-700",
        bar: "bg-emerald-600",
        cardBg: "bg-emerald-50/45",
        cardHoverBorder:
          "hover:border-emerald-300/80 focus-visible:border-emerald-400/80",
        cardActiveBg: "bg-emerald-100/55",
      };
    case "labor":
      return {
        badge: "bg-sky-50 text-sky-700",
        text: "text-sky-700",
        bar: "bg-sky-600",
        cardBg: "bg-sky-50/40",
        cardHoverBorder:
          "hover:border-sky-300/80 focus-visible:border-sky-400/80",
        cardActiveBg: "bg-sky-100/55",
      };
    case "equipment":
      return {
        badge: "bg-violet-50 text-violet-700",
        text: "text-violet-700",
        bar: "bg-violet-600",
        cardBg: "bg-violet-50/45",
        cardHoverBorder:
          "hover:border-violet-300/80 focus-visible:border-violet-400/80",
        cardActiveBg: "bg-violet-100/55",
      };
    case "permits":
      return {
        badge: "bg-amber-50 text-amber-700",
        text: "text-amber-700",
        bar: "bg-amber-500",
        cardBg: "bg-amber-50/45",
        cardHoverBorder:
          "hover:border-amber-300/80 focus-visible:border-amber-400/80",
        cardActiveBg: "bg-amber-100/55",
      };
    case "services":
      return {
        badge: "bg-rose-50 text-rose-700",
        text: "text-rose-700",
        bar: "bg-rose-500",
        cardBg: "bg-rose-50/45",
        cardHoverBorder:
          "hover:border-rose-300/80 focus-visible:border-rose-400/80",
        cardActiveBg: "bg-rose-100/55",
      };
    case "utilities":
      return {
        badge: "bg-cyan-50 text-cyan-700",
        text: "text-cyan-700",
        bar: "bg-cyan-600",
        cardBg: "bg-cyan-50/45",
        cardHoverBorder:
          "hover:border-cyan-300/80 focus-visible:border-cyan-400/80",
        cardActiveBg: "bg-cyan-100/55",
      };
    case "transportation":
      return {
        badge: "bg-orange-50 text-orange-700",
        text: "text-orange-700",
        bar: "bg-orange-500",
        cardBg: "bg-orange-50/45",
        cardHoverBorder:
          "hover:border-orange-300/80 focus-visible:border-orange-400/80",
        cardActiveBg: "bg-orange-100/55",
      };
    case "miscellaneous":
    default:
      return {
        badge: "bg-slate-100 text-slate-700",
        text: "text-slate-700",
        bar: "bg-slate-500",
        cardBg: "bg-slate-100/60",
        cardHoverBorder:
          "hover:border-slate-300/85 focus-visible:border-slate-400/85",
        cardActiveBg: "bg-slate-200/70",
      };
  }
}
