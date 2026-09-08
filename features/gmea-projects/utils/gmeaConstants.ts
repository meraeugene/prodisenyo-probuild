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

export const PAYMENT_TERM_TEMPLATES = [
  {
    id: "80-20",
    label: "80% / 20%",
    terms: [
      ["Down payment of the contract", 80],
      ["Completion and final turnover", 20],
    ],
  },
  {
    id: "30-70",
    label: "30% / 70%",
    terms: [
      ["Down payment", 30],
      ["Upon arrival of materials", 70],
    ],
  },
  {
    id: "75-25",
    label: "75% / 25%",
    terms: [
      ["Down payment of the contract", 75],
      ["Completion and turnover", 25],
    ],
  },
  {
    id: "30-30-30-10",
    label: "30% / 30% / 30% / 10%",
    terms: [
      ["Down payment", 30],
      ["50% installation works completed", 30],
      ["100% installation works completed", 30],
      ["Testing and commissioning", 10],
    ],
  },
] as const;

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600";
export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#076d69] px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50";
export const secondaryClass =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50";

export function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}
