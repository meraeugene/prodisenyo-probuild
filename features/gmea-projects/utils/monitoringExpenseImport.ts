import type { Expense, GmeaMutation, GmeaProject, WorkbookSource } from "../types";
import { expenseBreakdown, money, projectExpenseTotal, sumMoney } from "./gmeaCalculations";
import { groupMonitoringExpenses, normalizeExpenseIdentity, scoreExpenseMatch, type MonitoringExpenseSheet } from "./monitoringExpenseGroups";

export interface MonitoringExpensePlan {
  id: string;
  title: string;
  version: number;
  commands: GmeaMutation[];
  added: Expense[];
  matched: number;
  corrections: { id: string; before: number; after: number }[];
  replacedBalance: number;
  beforeTotal: number;
  expectedTotal: number;
  sourceItemizedTotal: number;
}

const projectAliases: Record<string, string> = {
  ROYALCABLEPSACONDUIT: "ROYALCALBEPSACONDUIT",
  WAREHOUSECORRALESAVE: "WAREHOUSECORRALEAAVE",
};

export function buildMonitoringExpensePlans(sheets: MonitoringExpenseSheet[], projects: GmeaProject[]) {
  const plans: MonitoringExpensePlan[] = [];
  const held: { title: string; count: number; amount: number; reason: string }[] = [];
  for (const sheet of sheets) {
    if (sheet.title === "FULLYBOOKED KETKAI") {
      held.push({ title: sheet.title, count: sheet.items.length, amount: sheet.total, reason: "User requested holding these expenses until the contract is provided." });
      continue;
    }
    const key = normalizeExpenseIdentity(sheet.title);
    const matches = projects.filter((project) => [key, projectAliases[key]].includes(normalizeExpenseIdentity(project.title)));
    if (matches.length !== 1) throw new Error(`Cannot uniquely map expense sheet ${sheet.title}.`);
    const project = matches[0];
    const used = new Set<string>();
    const commands: GmeaMutation[] = [];
    const added: Expense[] = [];
    const corrections: MonitoringExpensePlan["corrections"] = [];
    let matched = 0;
    for (const item of groupMonitoringExpenses(sheet)) {
      const entries = project.expenses.filter((expense) => !expense.workbook_balance && !used.has(expense.id));
      const tagged = entries.find((expense) => expense.workbook_source?.sha256 === item.workbook_source?.sha256
        && expense.workbook_source?.sheet === item.workbook_source?.sheet && expense.workbook_source?.cells === item.workbook_source?.cells);
      if (tagged && expenseBreakdown(tagged).gross !== item.amount) throw new Error(`Imported expense changed in ${sheet.title}; review rather than overwriting it.`);
      const candidates = entries.filter((expense) => Math.abs(money(expenseBreakdown(expense).gross - item.amount)) <= 0.5)
        .map((expense) => ({ expense, score: scoreExpenseMatch(item, expense) }))
        .filter((candidate) => candidate.score > 0).sort((a, b) => b.score - a.score);
      if (!tagged && candidates.length > 1 && candidates[0].score === candidates[1].score) throw new Error(`Ambiguous duplicate match: ${sheet.title}, ${item.description}.`);
      const existing = tagged ?? candidates[0]?.expense;
      if (!existing) {
        if (item.refunded_amount > item.amount) throw new Error("An individual expense cannot contain a grouped refund total.");
        const imported = { ...item, workbook_import_delta: item.amount };
        added.push(imported);
        commands.push({ kind: "expense", value: imported });
        continue;
      }
      used.add(existing.id);
      matched++;
      const before = expenseBreakdown(existing).gross;
      const correction = before !== item.amount;
      // Only the verified Bulua half-peso entry is a correction, not a new purchase.
      if (correction && !(sheet.title === "BULUA" && /STRANDED/i.test(item.description) && money(item.amount - before) === 0.5)) {
        throw new Error(`Expense amount needs review: ${sheet.title}, ${item.description}.`);
      }
      if (correction || (item.workbook_items && !existing.workbook_items)) {
        const value: Expense = { ...existing, workbook_source: item.workbook_source, workbook_items: item.workbook_items,
          notes: `${existing.notes ?? ""}\n${item.notes}`.trim() };
        if (correction) {
          value.amount = item.amount;
          value.invoice_number = item.invoice_number;
          value.source_previous_values = { amount: existing.amount, invoice_number: existing.invoice_number };
          value.workbook_import_delta = money(item.amount - before);
          corrections.push({ id: existing.id, before, after: item.amount });
        }
        commands.push({ kind: "expense", value });
      }
    }
    const newCost = sumMoney([...added.map((item) => expenseBreakdown(item).gross), ...corrections.map((item) => money(item.after - item.before))]);
    const hash = sheet.items[0].workbook_source!.sha256;
    const alreadyImported = sumMoney(project.expenses.filter((expense) => expense.workbook_source?.sha256 === hash).map((expense) => expense.workbook_import_delta ?? 0));
    const alreadySettled = sumMoney(project.expenses.flatMap((expense) => expense.workbook_balance?.settlements ?? []).filter((settlement) => settlement.source.sha256 === hash).map((settlement) => settlement.amount));
    let uncovered = sumMoney([newCost, alreadyImported, -alreadySettled]);
    let replacedBalance = 0;
    for (const balanceExpense of project.expenses.filter((expense) => (expense.workbook_balance?.amount ?? 0) > 0)) {
      const covered = Math.min(balanceExpense.workbook_balance!.amount, uncovered);
      if (covered <= 0) continue;
      const balance = balanceExpense.workbook_balance!;
      const source: WorkbookSource = { ...(added[0]?.workbook_source ?? sheet.items[0].workbook_source!), cells: `${sheet.items[0].workbook_source!.cells.split(":")[0]}:${sheet.totalCell}` };
      commands.push({ kind: "expense", value: { ...balanceExpense,
        workbook_balance: { ...balance, amount: money(balance.amount - covered), original_amount: balance.original_amount ?? balance.amount,
          settlements: [...(balance.settlements ?? []), { amount: covered, expense_ids: [...added.map((item) => item.id), ...corrections.map((item) => item.id), ...project.expenses.filter((expense) => expense.workbook_source?.sha256 === hash && (expense.workbook_import_delta ?? 0) > 0).map((expense) => expense.id)], source }] },
      } });
      uncovered = money(uncovered - covered);
      replacedBalance = sumMoney([replacedBalance, covered]);
    }
    const beforeTotal = projectExpenseTotal(project);
    plans.push({ id: project.id, title: project.title, version: project.version, commands, added, matched, corrections, replacedBalance, beforeTotal,
      expectedTotal: sumMoney([beforeTotal, newCost, -replacedBalance]), sourceItemizedTotal: sheet.total });
  }
  return { plans, held };
}

export function verifyMonitoringExpenseResult(plans: MonitoringExpensePlan[], projects: GmeaProject[]) {
  for (const plan of plans) {
    const project = projects.find((item) => item.id === plan.id);
    if (!project || projectExpenseTotal(project) !== plan.expectedTotal) throw new Error(`Expense total verification failed: ${plan.title}.`);
    for (const item of plan.added) {
      if (project.expenses.filter((expense) => expense.id === item.id && expenseBreakdown(expense).gross === item.amount).length !== 1) throw new Error(`Missing or duplicated imported expense: ${plan.title}, ${item.description}.`);
    }
  }
}
