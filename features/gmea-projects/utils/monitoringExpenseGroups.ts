import type { Expense } from "../types";

export type MonitoringExpense = Expense & { source_row: number };
export interface MonitoringExpenseSheet {
  title: string;
  rawSheet: string;
  items: MonitoringExpense[];
  total: number;
  displayedTotal: number;
  totalCell: string;
  ignored: number[];
}

export function normalizeExpenseIdentity(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** These source groups correspond to existing combined invoices/payroll entries. */
export function groupMonitoringExpenses(sheet: MonitoringExpenseSheet): Expense[] {
  const ranges = sheet.title === "MARAMAG" ? [[25, 26, "Breakfast & Lunch"]] :
    sheet.title === "CVH-CCTV NETWORK" ? [[12, 13, "CCTV NVR, 32 Cameras and 1 Outdoor Cat 6"]] :
    sheet.title === "ROYAL CABLE PSA CONDUIT" ? [[18, 31, "Rico Kevin Garder, Patrick Laput"], [33, 44, "Rico Kevin Garder, Patrick Laput"], [47, 58, "Rico Kevin Garder, Patrick Laput"]] : [];
  const consumed = new Set<number>();
  const output: Expense[] = [];
  for (const [start, end, description] of ranges) {
    const items = sheet.items.filter((item) => item.source_row >= Number(start) && item.source_row <= Number(end));
    if (!items.length) throw new Error(`Missing grouped expense source rows in ${sheet.title}.`);
    items.forEach((item) => consumed.add(item.source_row));
    const amount = items.reduce((sum, item) => sum + Math.round(item.amount * 100), 0) / 100;
    const source = items[0].workbook_source!;
    const cells = `${source.cells.split(":")[0]}:${items.at(-1)!.workbook_source!.cells.split(":").at(-1)}`;
    output.push({ ...items[0], description: String(description), amount,
      category: sheet.title === "ROYAL CABLE PSA CONDUIT" ? "Labor / Payroll" : items[0].category,
      workbook_source: { ...source, cells },
      workbook_items: items.map((item) => ({ description: item.description, date: item.date, amount: item.amount, supplier: item.supplier, invoice_number: item.invoice_number, source_cells: item.workbook_source!.cells })),
    });
  }
  return [...output, ...sheet.items.filter((item) => !consumed.has(item.source_row))];
}

function similarity(left: string, right: string) {
  const words = (text: string) => new Set(text.toUpperCase().match(/[A-Z0-9]+/g)?.filter((word) => word.length > 2) ?? []);
  const a = words(left), b = words(right);
  if (!a.size || !b.size) return 0;
  return [...a].filter((word) => b.has(word)).length / Math.max(a.size, b.size);
}

export function scoreExpenseMatch(source: Expense, existing: Expense) {
  const invoice = source.invoice_number && normalizeExpenseIdentity(source.invoice_number) === normalizeExpenseIdentity(existing.invoice_number);
  const description = similarity(source.description, existing.description);
  const supplier = source.supplier && existing.supplier ? similarity(source.supplier, existing.supplier) : 0;
  if (!invoice && description < 0.25 && supplier < 0.6) return 0;
  return (invoice ? 100 : 0) + description * 20 + supplier * 10 +
    (source.date && source.date === existing.date ? 30 : 0) +
    (normalizeExpenseIdentity(source.description) === normalizeExpenseIdentity(existing.description) ? 20 : 0);
}
