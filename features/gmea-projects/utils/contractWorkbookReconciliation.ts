import type { ContractPaymentTermInput, GmeaMutation, GmeaProject, WorkbookSource } from "../types";
import { contractCollectionSummary, money, postedReceiptTotal, projectExpenseTotal, sumMoney } from "./gmeaCalculations";

export interface WorkbookContract {
  row: number;
  title: string;
  contract: number;
  expenses: number;
  status: GmeaProject["status"];
  terms: { amount: number; collected: number; date: string | null; cells: string }[];
}

export interface WorkbookProjectPlan {
  id: string;
  title: string;
  version: number;
  commands: GmeaMutation[];
  expected: { contract: number; expenses: number; collected: number; outstanding: number; status: GmeaProject["status"] };
}

type Identify = (seed: string) => string;

/** Reconcile source amounts, not percentage labels; preserve every original receipt. */
export function buildContractWorkbookPlan(
  records: WorkbookContract[], projects: GmeaProject[],
  source: Omit<WorkbookSource, "cells">, identify: Identify,
): WorkbookProjectPlan[] {
  const matched = new Set<string>();
  return records.map((record) => {
    const candidates = projects.filter((project) => money(project.contract_amount) === money(record.contract));
    if (candidates.length !== 1) throw new Error(`Cannot uniquely match ${record.title}; no records were changed.`);
    const project = candidates[0];
    // Contract amount alone is insufficient evidence of identity.
    const words = record.title.toUpperCase().match(/[A-Z0-9]+/g) ?? [];
    const title = `${project.title} ${project.name}`.toUpperCase();
    if (!words.some((word) => word.length >= 4 && title.includes(word))) throw new Error(`Project identity does not match ${record.title}.`);
    if (matched.has(project.id)) throw new Error("Duplicate source project.");
    matched.add(project.id);
    if (project.tax_rate !== 0) throw new Error(`${record.title}: the source does not specify project tax.`);
    if (record.terms.length !== project.payment_terms.length) throw new Error(`${record.title}: payment terms require manual mapping.`);
    for (const amount of [record.contract, record.expenses, ...record.terms.flatMap((term) => [term.amount, term.collected])]) {
      if (!Number.isFinite(amount) || amount < 0) throw new Error("Invalid workbook amount.");
    }
    if (sumMoney(record.terms.map((term) => term.amount)) !== money(record.contract)) throw new Error(`${record.title}: source schedule does not total the contract.`);
    const commands: GmeaMutation[] = [];
    const voids: GmeaMutation[] = [];
    const receipts: GmeaMutation[] = [];
    const terms: ContractPaymentTermInput[] = [];
    const ordered = [...project.payment_terms].sort((a, b) => Number((a as unknown as { sort_order?: number }).sort_order ?? 0) - Number((b as unknown as { sort_order?: number }).sort_order ?? 0));
    let scheduleChanged = false;
    record.terms.forEach((target, index) => {
      const term = ordered[index];
      if (target.collected > target.amount) throw new Error(`${record.title}: collection exceeds scheduled amount.`);
      if (term.imported_receipts?.some((entry) => entry.source.sha256 !== source.sha256)) throw new Error("A different workbook was already imported; review before replacing its balances.");
      const posted = term.receipts.filter((receipt) => receipt.status === "posted");
      const matches = postedReceiptTotal(term) === money(target.collected)
        && posted.every((receipt) => receipt.received_date === target.date);
      let imported = term.imported_receipts ?? [];
      if (!matches) {
        posted.forEach((receipt) => voids.push({ kind: "void_receipt", receipt_id: receipt.id, reason: `Reconciled to ${source.workbook} ${source.sheet}!${target.cells}; original receipt retained.` }));
        imported = [];
        if (target.collected > 0) {
          const id = identify(`${source.sha256}:${project.id}:${term.id}:collection:${target.collected}:${target.date}`);
          if (term.receipts.some((receipt) => receipt.id === id && receipt.status === "voided")) throw new Error("An imported receipt was subsequently voided; review rather than reposting it.");
          if (target.date) {
            receipts.push({ kind: "record_receipt", value: {
              id, term_id: term.id, amount: money(target.collected), received_date: target.date,
              method: "Workbook collection", reference_number: `${source.sheet}!${target.cells}`,
              notes: `Source: ${source.workbook}; SHA-256 ${source.sha256}`,
            } });
          } else {
            imported = [{ id, amount: money(target.collected), received_date: null, source: { ...source, cells: target.cells } }];
          }
        }
      }
      const next: ContractPaymentTermInput = {
        id: term.id, description: term.description, value_mode: "fixed", percentage: null,
        amount: money(target.amount), notes: term.notes,
        imported_receipts: imported,
      };
      if (term.value_mode !== "fixed" || term.amount !== next.amount || JSON.stringify(term.imported_receipts ?? []) !== JSON.stringify(imported)) scheduleChanged = true;
      terms.push(next);
    });
    commands.push(...voids);
    if (scheduleChanged) commands.push({ kind: "contract_terms", value: { contract_amount: record.contract, tax_rate: 0, payment_terms: terms } });
    commands.push(...receipts);

    const balances = project.expenses.filter((expense) => expense.workbook_balance);
    if (balances.some((expense) => expense.workbook_balance!.source.sha256 !== source.sha256)) throw new Error("A different workbook expense balance already exists.");
    const itemized = projectExpenseTotal({ expenses: project.expenses.filter((expense) => !expense.workbook_balance) });
    const difference = money(record.expenses - itemized);
    if (balances.length) {
      if (projectExpenseTotal(project) !== money(record.expenses)) throw new Error(`${record.title}: expenses changed after import; the original workbook balance will not be reset.`);
    } else if (difference !== 0) {
      commands.push({ kind: "expense", value: {
        id: identify(`${source.sha256}:${project.id}:expense-balance`), date: "",
        description: "Workbook expense balance", category: "Other",
        supplier: "", invoice_number: "", invoice_name: "", amount: 0, refunded_amount: 0,
        vat_mode: "off", vat_rate: 0, method: "Workbook reconciliation",
        notes: `Summary balance from ${source.sheet}!N${record.row}; not an additional invoice.`,
        workbook_balance: { amount: difference, source_total: money(record.expenses), itemized_total: itemized, source: { ...source, cells: `N${record.row}` } },
      } });
    }
    if (project.status !== record.status) commands.push({ kind: "project_status", value: { status: record.status } });
    const collected = sumMoney(record.terms.map((term) => term.collected));
    return { id: project.id, title: project.title, version: project.version, commands,
      expected: { contract: money(record.contract), expenses: money(record.expenses), collected, outstanding: money(record.contract - collected), status: record.status } };
  });
}

export function verifyContractWorkbookResult(plans: WorkbookProjectPlan[], projects: GmeaProject[]) {
  for (const plan of plans) {
    const project = projects.find((entry) => entry.id === plan.id);
    if (!project) throw new Error(`Missing project after reconciliation: ${plan.title}`);
    const collection = contractCollectionSummary(project);
    if (money(project.contract_amount) !== plan.expected.contract || projectExpenseTotal(project) !== plan.expected.expenses
      || collection.received !== plan.expected.collected || collection.outstanding !== plan.expected.outstanding || project.status !== plan.expected.status) {
      throw new Error(`Reconciliation verification failed for ${plan.title}.`);
    }
  }
}
