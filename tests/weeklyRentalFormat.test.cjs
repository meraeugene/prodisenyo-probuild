const assert = require('node:assert/strict'), test = require('node:test');
const load = require('./helpers/loadGmeaModule.cjs');
const source = load('features/gmea-rentals/utils/rentalWorkbookWeeks.ts');
const reporting = load('features/gmea-rentals/utils/rentalReportingWeeks.ts');
const table = load('features/gmea-rentals/utils/rentalWorkbookTable.ts');
const { buildRentalExpensePages, selectRentalExpensePageRows } = load('features/gmea-rentals/utils/rentalExpensePages.ts');
const { buildWeeklyOnlyReconciliation } = require('../scripts/lib/weeklyOnlyReconciliation.cjs');
const { parseCutoffLabel } = require('../scripts/lib/allWeeklyCutoffs.cjs');
const hash = 'a'.repeat(64), id = '11111111-1111-4111-8111-111111111111';
const meta = overrides => ({ month: '2026-01', start: '2026-01-05', end: '2026-01-10', label: 'JAN 05-10,2026', block: 'B6', kind: 'equipment',
  section: 'equipment', party: 'Canter', order: 700, source: { sheet: 'JAN WEEKLY', cell: 'E7', sha256: hash }, ...overrides });
const expense = (overrides = {}, metadata = meta({})) => ({ id, date: '2026-01-05', amount: 2000, vat_mode: 'off', vat_rate: 0, refunded_amount: 0,
  description: 'Diesel', supplier: '', notes: source.encodeRentalWorkbookWeekNotes('Original source', metadata), ...overrides });

test('source reporting months retain cross-month cutoffs and ordinary week metadata stays strict', () => {
  assert.deepEqual(parseCutoffLabel('MAR 31 - APR 05, 2025', '2025-04'), { month: '2025-04', start: '2025-03-31', end: '2025-04-05', label: 'MAR 31 - APR 05, 2025' });
  assert.equal(parseCutoffLabel('OCT 13-182025', '2025-10').end, '2025-10-18');
  assert.equal(parseCutoffLabel('September 01-05,206', '2026-09').start, '2026-09-01');
  const value = meta({ month: '2025-04', start: '2025-03-31', end: '2025-04-05' });
  assert.equal(source.validateRentalWorkbookWeek(value).month, '2025-04');
  assert.throws(() => reporting.validateRentalWeekMetadata(value));
  const weeks = reporting.buildRentalReportingWeeks([expense({ date: '2025-03-31' }, value)]);
  assert.equal(reporting.sumRentalReportingMonth(weeks, '2025-04'), 2000);
  assert.equal(reporting.sumRentalReportingMonth(weeks, '2025-03'), 0);
});

test('weekly metadata is preserved through note edits and is hidden from editable user notes', () => {
  const original = source.encodeRentalWorkbookWeekNotes('Receipt retained', meta({}));
  assert.equal(reporting.rentalExpenseUserNotes(original), 'Receipt retained');
  const edited = source.preserveRentalWorkbookWeekNotes(original, 'Changed note');
  assert.equal(source.rentalWorkbookWeekMetadata(edited).source.cell, 'E7');
  assert.equal(reporting.rentalExpenseUserNotes(edited), 'Changed note');
  assert.equal(edited.split('@rental-workbook-week:').length, 2);
  assert.equal(source.rentalWorkbookWeekMetadata('@rental-workbook-week:{}'), null);
});

test('weeks and equipment dates are ascending while partial 13th-month entries remain in their source cutoff', () => {
  const rows = [expense({ id: 'later', date: '2026-01-30' }, meta({ start: '2026-01-26', end: '2026-01-31', order: 7600 })),
    expense({ id: 'jan10', date: '2026-01-10' }, meta({ order: 1500 })), expense({ id: 'jan5' }),
    expense({ id: 'bonus', date: '2026-01-03', amount: 500 }, meta({ section: 'salary', kind: '13th-month', party: 'REMARK', order: 1800 }))];
  const weeks = reporting.buildRentalReportingWeeks(rows);
  assert.equal(weeks[0].start, '2026-01-05');
  assert.deepEqual(table.rentalWorkbookEquipmentDates(weeks[0].expenses).map(group => group.date), ['2026-01-05', '2026-01-10']);
  assert.equal(table.rentalWorkbookPayeeGroups(weeks[0].expenses)[0].rows[0].date, '2026-01-03');
  assert.equal(weeks[0].total, 4500);
});

test('expense pages keep whole source weeks in chronological order and preserve unassigned manual expenses', () => {
  const later = expense({ id: 'later', date: '2026-01-30' }, meta({ start: '2026-01-26', end: '2026-01-31' }));
  const bonus = expense({ id: 'bonus', date: '2026-01-03', amount: 500 }, meta({ section: 'salary', kind: '13th-month' }));
  const manual = expense({ id: 'manual', notes: 'Manual expense' });
  const pages = buildRentalExpensePages([later, manual, expense(), bonus]);
  assert.deepEqual(pages.map(page => page.id), ['2026-01:2026-01-05:2026-01-10', '2026-01:2026-01-26:2026-01-31', 'other']);
  assert.equal(pages[0].week.total, 2500);
  assert.equal(pages[0].expenses.length, 2);
  assert.deepEqual(pages[2].expenses.map(row => row.id), ['manual']);
  assert.equal(pages[2].week, null);
  assert.deepEqual(buildRentalExpensePages([]), []);
});

test('table rows follow workbook order rather than transaction date or record id without changing amounts', () => {
  const yellow = expense({ id: 'yellow', date: '2026-02-02', amount: 3000 }, meta({ order: 800, party: 'Yellow Dump' }));
  const canter = expense({ id: 'canter', date: '2026-02-02', amount: 2000 }, meta({ order: 900 }));
  const salary = expense({ id: 'salary', date: '2026-02-07', amount: 7233.88 }, meta({ order: 2500, section: 'salary', kind: 'salary' }));
  const advance = expense({ id: 'advance', date: '2026-02-04', amount: 1000 }, meta({ order: 2200, section: 'cash-advance', kind: 'cash-advance' }));
  const rows = [advance, canter, salary, yellow].map(expense => ({ type: 'expense', id: `expense:${expense.id}`, expense, date: expense.date, rental: null }));
  const pages = buildRentalExpensePages(rows.map(row => row.expense));
  const selected = selectRentalExpensePageRows(rows, pages[0]);
  assert.deepEqual(selected.map(row => row.expense.id), ['yellow', 'canter', 'advance', 'salary']);
  assert.equal(selected.reduce((sum, row) => sum + Math.round(row.expense.amount * 100), 0), Math.round(pages[0].week.total * 100));
  assert.deepEqual(selectRentalExpensePageRows(rows), []);
});

test('weekly-only reconciliation excludes unmatched imports, preserves manual records and supplies provenance', () => {
  const row = { id, sheet: 'JAN WEEKLY', address: 'E7', block: 'B6', sourceLocator: 'JAN WEEKLY!E7:weekly-equipment', date: '2026-01-05', amount: 2000,
    equipment: 'Canter', category: 'Diesel/Fuel', rawDescription: 'Diesel', section: 'equipment', kind: 'equipment', order: 700, party: 'Canter', payee: '', issues: [], cutoff: meta({}) };
  const saved = { id, expense_date: row.date, amount: 2000, equipment_id: 'asset', category_id: 'fuel', rental_id: null, income_record_id: null,
    vat_mode: 'off', vat_rate: 0, refunded_amount: 0, description: 'Diesel', supplier: '', method: '', invoice_number: '', version: 1,
    notes: 'Historical import; source: JAN2026!D7:monthly-equipment;' };
  const unrepresented = { ...saved, id: 'older', expense_date: '2025-02-01', notes: 'Historical import; source: FEB2025!D7:monthly-equipment;' };
  const manual = { ...saved, id: 'manual', expense_date: '2026-10-21', notes: 'Manual receipt' };
  const state = { gmea_rental_expenses: [saved, unrepresented, manual], gmea_rental_equipment: [{ id: 'asset', name: 'Canter' }],
    gmea_rental_expense_categories: [{ id: 'fuel', name: 'Diesel/Fuel', is_active: true }] };
  const runtime = { ...source, normalizeRentalExpenseMutation: input => input };
  const result = buildWeeklyOnlyReconciliation({ source: { sha256: hash }, records: [row] }, state, runtime);
  assert.deepEqual(result.removals.map(row => row.id), ['older']);
  assert.equal(source.rentalWorkbookWeekMetadata(result.updates[0].command.value.notes).month, '2026-01');
  assert.equal(result.summary.weeklyAmount, 2000);
  const updated = { ...saved, ...result.updates[0].command.value, expense_date: saved.expense_date };
  const repeat = buildWeeklyOnlyReconciliation({ source: { sha256: hash }, records: [row] }, { ...state, gmea_rental_expenses: [updated, manual] }, runtime);
  assert.equal(repeat.updates.length, 0); assert.equal(repeat.removals.length, 0);
});

test('source exclusion refuses manual or linked records, checks role and protects against concurrent changes', async () => {
  const { excludeNonWeeklyWorkbookExpensesAction: exclude } = load('actions/gmeaWeeklySourceExclusion.ts');
  const row = { id, version: 2, notes: 'Historical import; source: JAN2026!D7:monthly-equipment;', rental_id: null, income_record_id: null, amount: 2000, expense_date: '2026-01-05' };
  const calls = []; let allowed = false, current = row;
  const db = { from(table) { return { select() { return this; }, eq() { return this; }, async single() { return { data: table === 'profiles' ? { role: allowed ? 'gmea' : 'ceo', is_active: true } : current }; } }; },
    async rpc(name, args) { calls.push(args); return { data: id }; } };
  await assert.rejects(exclude(db, id, [row], () => {}), /active GMEA/);
  allowed = true;
  await assert.rejects(exclude(db, id, [{ ...row, notes: 'Manual' }], () => {}), /source-verified/);
  await assert.rejects(exclude(db, id, [{ ...row, rental_id: id }], () => {}), /source-verified/);
  current = { ...row, version: 3 };
  await assert.rejects(exclude(db, id, [row], () => {}), /changed after review/);
  assert.equal(calls.length, 0);
  current = row;
  await exclude(db, id, [row], () => {});
  assert.equal(calls[0].p_version, 2); assert.equal(calls[0].p_command.kind, 'delete');
});
