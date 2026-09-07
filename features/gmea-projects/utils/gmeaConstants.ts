export const EXPENSE_CATEGORIES = [
  "Materials",
  "Labor / Payroll",
  "Meals",
  "Transport",
  "Fuel",
  "Delivery",
  "Commission",
  "Operations",
  "Other",
] as const;

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";
export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f6a37] px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50";
export const secondaryClass =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50";

export function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}
