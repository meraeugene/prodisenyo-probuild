const { normalize } = require('./allWeeklySourceValues.cjs');
const cents = value => Math.round(Number(value) * 100);
const sourceCell = row => `${row.sheet}!${row.address}`;
const admin = row => /ADMIN|MARIEGEN|MAEIEGEN/i.test(row.party);
function sameEvent(left, right) {
  return left.date === right.date && cents(left.amount) === cents(right.amount) && left.section === right.section
    && normalize(left.equipment || left.party) === normalize(right.equipment || right.party)
    && normalize(left.rawDescription) === normalize(right.rawDescription);
}
function directSource(expense, row) {
  const first = String(expense.notes || '').split('\n')[0];
  if (first.startsWith('@rental-week:')) {
    const metadata = JSON.parse(first.slice('@rental-week:'.length));
    if (metadata.source?.sheet === row.sheet && metadata.source?.cell === row.address) return true;
  }
  return String(expense.notes || '').includes(`source: ${sourceCell(row)}:weekly-`);
}
function buildAllWeeklyImportPlan(report, state, adminPolicy, preferWeekly = false) {
  if (!['include', 'exclude-salary', 'exclude-all'].includes(adminPolicy)) throw new Error('Select an explicit admin policy.');
  const expenses = state.gmea_rental_expenses, categories = state.gmea_rental_expense_categories, equipment = state.gmea_rental_equipment;
  const selected = [], excluded = [], held = [], duplicates = [], assigned = [], used = new Set(), updates = [], incomplete = [];
  for (const row of report.records) {
    if (row.excludeReason) { incomplete.push(row); continue; }
    if (admin(row) && (adminPolicy === 'exclude-all' || adminPolicy === 'exclude-salary' && row.section === 'salary')) { excluded.push(row); continue; }
    if (row.issues.length) { held.push(row); continue; }
    if (row.section !== 'equipment' && report.records.some(other => other !== row && !other.issues.length && other.date === row.date && other.section === row.section
      && normalize(other.party) === normalize(row.party) && normalize(other.rawDescription) === normalize(row.rawDescription) && cents(other.amount) !== cents(row.amount))) {
      held.push({ ...row, issues: ['Conflicting amounts for the same payee/date/section'] }); continue;
    }
    const duplicate = selected.find(other => sameEvent(other, row));
    if (duplicate) duplicates.push({ row, duplicateOf: duplicate.sourceLocator });
    else selected.push(row);
  }
  const pending = [];
  for (const row of selected) {
    const matches = expenses.filter(expense => directSource(expense, row));
    if (matches.length > 1) throw new Error(`Multiple saved records for ${row.sourceLocator}`);
    if (!matches.length) { pending.push(row); continue; }
    const expense = matches[0];
    if (expense.expense_date !== row.date || cents(expense.amount) !== cents(row.amount)) {
      held.push({ ...row, issues: ['Saved source date or amount differs; review required'], saved: { id: expense.id, date: expense.expense_date, amount: expense.amount } }); continue;
    }
    if (used.has(expense.id)) throw new Error(`Existing record reused: ${row.sourceLocator}`);
    used.add(expense.id); assigned.push({ row, id: expense.id, existing: true, match: 'source' });
  }
  const newRecords = [], unmatched = [];
  for (const row of pending) {
    const assets = row.equipment ? equipment.filter(item => normalize(item.name).replace(/TRUCK/g, '') === normalize(row.equipment).replace(/TRUCK/g, '')) : [];
    if (row.equipment && assets.length !== 1) throw new Error(`Cannot resolve equipment: ${row.equipment}`);
    const category = categories.find(item => item.is_active && item.name === row.category);
    if (!category) throw new Error(`Cannot resolve category: ${row.category}`);
    const candidates = expenses.filter(expense => !used.has(expense.id) && !expense.rental_id && !expense.income_record_id
      && expense.expense_date === row.date && cents(expense.amount) === cents(row.amount)
      && expense.equipment_id === (assets[0]?.id ?? null)
      && Number(expense.refunded_amount) === 0 && expense.vat_mode === 'off'
      && (row.section === 'equipment' ? normalize(expense.description) === normalize(row.rawDescription) || expense.category_id === category.id
        : normalize(expense.description) === normalize(row.rawDescription) && normalize(expense.supplier) === normalize(row.party)));
    candidates.sort((a, b) => a.id.localeCompare(b.id));
    if (candidates.length) {
      const expense = candidates[0]; used.add(expense.id); assigned.push({ row, id: expense.id, existing: true, match: 'event' });
    } else unmatched.push({ row, assetId: assets[0]?.id, category });
  }
  // Reserve exact matches across the whole workbook before reconciling differences.
  for (const { row, assetId, category } of unmatched) {
      const sameDay = row.section === 'equipment' ? expenses.filter(expense => !used.has(expense.id) && !expense.rental_id && !expense.income_record_id
        && expense.expense_date === row.date && expense.equipment_id === assetId
        && expense.notes.includes('Historical import;') && Number(expense.refunded_amount) === 0 && expense.vat_mode === 'off') : [];
      const sameCategory = sameDay.filter(expense => expense.category_id === category.id);
      if (sameCategory.length > 1 && sameCategory.reduce((total, expense) => total + cents(expense.amount), 0) === cents(row.amount)) {
        sameCategory.forEach(expense => used.add(expense.id));
        assigned.push({ row, id: sameCategory[0].id, ids: sameCategory.map(expense => expense.id), existing: true, match: 'itemized-sum' });
      } else if (preferWeekly && (sameCategory.length === 1 || sameDay.filter(expense => cents(expense.amount) === cents(row.amount)).length === 1)) {
        const expense = sameCategory[0] || sameDay.find(expense => cents(expense.amount) === cents(row.amount));
        used.add(expense.id); updates.push({ row, expense, categoryId: category.id });
        assigned.push({ row, id: expense.id, existing: true, match: 'weekly-correction' });
      } else if (sameCategory.length || sameDay.some(expense => cents(expense.amount) === cents(row.amount))) {
        held.push({ ...row, issues: ['Weekly value conflicts with an existing equipment-sheet expense'], saved: sameDay.map(expense => ({ id: expense.id, amount: expense.amount, description: expense.description })) });
      } else {
        newRecords.push(row); assigned.push({ row, id: row.id, existing: false, match: 'new' });
      }
  }
  const excludedExisting = expenses.filter(expense => excluded.some(row => directSource(expense, row)));
  return { selected, excluded, held, duplicates, assigned, newRecords, updates, excludedExisting, incomplete };
}
module.exports = { buildAllWeeklyImportPlan, sameEvent, directSource };
