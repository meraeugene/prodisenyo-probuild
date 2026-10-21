const { buildAllWeeklyImportPlan } = require('./allWeeklyImportPlan.cjs');
const sum = rows => rows.reduce((total, row) => total + Math.round(Number(row.amount) * 100), 0) / 100;
function buildWeeklyOnlyReconciliation(report, state, runtime) {
  const sourcePlan = buildAllWeeklyImportPlan(report, state, 'exclude-all', true);
  if (sourcePlan.held.length || sourcePlan.newRecords.length || sourcePlan.updates.length) throw new Error('Reconcile the weekly amounts before applying weekly-only grouping.');
  const kept = new Set(), updates = [], removals = [];
  for (const { row, id, ids } of sourcePlan.assigned) {
    if (!row.cutoff) throw new Error(`Missing workbook cutoff: ${row.sourceLocator}`);
    const original = state.gmea_rental_expenses.find(expense => expense.id === id);
    const category = state.gmea_rental_expense_categories.find(category => category.is_active && category.name === row.category);
    if (!original || !category) throw new Error(`Unresolved saved weekly row: ${row.sourceLocator}`);
    const metadata = { ...row.cutoff, section: row.section, kind: row.kind, party: row.party, order: row.order,
      source: { sheet: row.sheet, cell: row.address, sha256: report.source.sha256 } };
    const notes = runtime.encodeRentalWorkbookWeekNotes(original.notes, metadata);
    const value = { id, rental_id: original.rental_id, income_record_id: original.income_record_id ?? null,
      equipment_id: original.equipment_id, category_id: category.id, date: row.date, description: row.rawDescription,
      supplier: row.payee || '', method: original.method, invoice_number: original.invoice_number,
      amount: row.amount, refunded_amount: Number(original.refunded_amount), vat_mode: original.vat_mode, vat_rate: Number(original.vat_rate), notes, version: original.version };
    kept.add(id);
    if (original.notes !== notes || original.description !== value.description || original.category_id !== value.category_id
      || original.supplier !== value.supplier || Math.round(Number(original.amount) * 100) !== Math.round(value.amount * 100)) {
      const command = runtime.normalizeRentalExpenseMutation({ kind: 'update', value });
      updates.push({ id, version: original.version, source: row.sourceLocator, command });
    }
    for (const duplicateId of (ids || []).filter(duplicateId => duplicateId !== id)) {
      const duplicate = state.gmea_rental_expenses.find(expense => expense.id === duplicateId);
      removals.push({ ...duplicate, reason: `Consolidated into weekly source ${row.sourceLocator}` });
    }
  }
  for (const expense of state.gmea_rental_expenses) {
    if (kept.has(expense.id) || removals.some(row => row.id === expense.id)) continue;
    if (expense.rental_id || expense.income_record_id) continue;
    const imported = /source: [^;\n]+:(?:monthly-equipment|weekly-[a-z-]+)/.test(expense.notes)
      && (expense.notes.includes('Historical import;') || expense.notes.includes('Weekly workbook import;'));
    if (imported) removals.push({ ...expense, reason: 'Not represented by a retained non-admin weekly source row' });
  }
  const months = new Map(), weeks = new Set();
  for (const { row } of sourcePlan.assigned) {
    months.set(row.cutoff.month, (months.get(row.cutoff.month) || 0) + Math.round(row.amount * 100));
    weeks.add(`${row.cutoff.month}:${row.cutoff.start}:${row.cutoff.end}`);
  }
  return { sourcePlan, kept: [...kept], updates, removals,
    summary: { weeklyRows: kept.size, months: months.size, weeks: weeks.size, updateCount: updates.length, removedCount: removals.length,
      removedAmount: sum(removals), weeklyAmount: sum(sourcePlan.assigned.map(item => item.row)),
      monthlyAmounts: Object.fromEntries([...months].sort().map(([month, amount]) => [month, amount / 100])) } };
}
module.exports = { buildWeeklyOnlyReconciliation };
