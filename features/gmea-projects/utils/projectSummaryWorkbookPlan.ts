import type { GmeaMutation, GmeaProject, ProjectDetailsInput, WorkbookSource } from "../types";
import { normalizeProjectDetails } from "./gmeaValidation";
import { paymentTermInput } from "./paymentTerms";

export interface SummaryWorkbookRecord {
  row: number; title: string; contract: number; details: Omit<ProjectDetailsInput, "color">;
  terms: { amount: number; cells: string; display_percentage: number | null }[];
}

export function buildProjectSummaryWorkbookPlans(records: SummaryWorkbookRecord[], projects: GmeaProject[], source: Omit<WorkbookSource, "cells">) {
  const seen = new Set<string>();
  return records.map(record => {
    const candidates = projects.filter(project => project.contract_amount === record.contract);
    if (candidates.length !== 1) throw new Error(`Cannot uniquely match ${record.title}.`);
    const project = candidates[0];
    if (seen.has(project.id)) throw new Error("Duplicate workbook project.");
    seen.add(project.id);
    if (record.terms.length !== project.payment_terms.length) throw new Error("Payment milestones need review.");
    const commands: GmeaMutation[] = [];
    const details = normalizeProjectDetails({ ...record.details, color: project.color });
    if (Object.entries(details).some(([key, value]) => project[key as keyof GmeaProject] !== value)) commands.push({ kind: "project_details", value: details });
    const terms = project.payment_terms.map((term, index) => {
      if (term.amount !== record.terms[index].amount || term.value_mode !== "fixed") throw new Error("Keep reconciled fixed payment amounts.");
      return { ...paymentTermInput(term), display_percentage: record.terms[index].display_percentage,
        summary_source: { ...source, cells: record.terms[index].cells } };
    });
    if (terms.some((term, index) => term.display_percentage !== project.payment_terms[index].display_percentage
      || Object.entries(term.summary_source).some(([key, value]) => project.payment_terms[index].summary_source?.[key as keyof WorkbookSource] !== value))) {
      commands.push({ kind: "contract_terms", value: { contract_amount: project.contract_amount, tax_rate: project.tax_rate, payment_terms: terms } });
    }
    return { id: project.id, title: project.title, version: project.version, commands, details, percentages: terms.map(term => term.display_percentage) };
  });
}
