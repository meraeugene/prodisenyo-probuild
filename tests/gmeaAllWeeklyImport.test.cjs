const assert = require('node:assert/strict'), test = require('node:test');
const { parseAllWeeklyWorkbook } = require('../scripts/lib/allWeeklyWorkbook.cjs');
const { parseDate } = require('../scripts/lib/allWeeklySourceValues.cjs');
const { buildAllWeeklyImportPlan } = require('../scripts/lib/allWeeklyImportPlan.cjs');
const { applyAllWeeklyResolutions } = require('../scripts/lib/allWeeklyResolutions.cjs');
const load = require('./helpers/loadGmeaModule.cjs');
const hash = 'a'.repeat(64), id = '11111111-1111-4111-8111-111111111111';
const source = { path: 'test.xlsx', sha256: hash };
const record = overrides => ({ id, sheet: 'APR WEEKLY', address: 'E2', block: 'B1', sourceLocator: 'APR WEEKLY!E2:weekly-equipment',
  date: '2025-04-01', amount: 100, equipment: 'Canter', category: 'Diesel/Fuel', rawDescription: 'Diesel', section: 'equipment', party: 'Canter', payee: '', issues: [], ...overrides });
const saved = overrides => ({ id, expense_date: '2025-04-01', amount: 100, equipment_id: 'asset', category_id: 'fuel', rental_id: null,
  income_record_id: null, refunded_amount: 0, vat_mode: 'off', notes: 'Historical import; source: APR 2025!D4:monthly-equipment;', description: 'Diesel', supplier: '', ...overrides });
const state = expenses => ({ gmea_rental_expenses: expenses, gmea_rental_equipment: [{ id: 'asset', name: 'Canter' }],
  gmea_rental_expense_categories: [{ id: 'fuel', name: 'Diesel/Fuel', is_active: true }, { id: 'maintenance', name: 'Maintenance', is_active: true }] });
const sheet = (values, merges = []) => Object.fromEntries([['!ref', 'A1:K20'], ['!merges', merges], ...Object.entries(values).map(([key, v]) => [key, { v }])]);

test('all weekly layouts include equipment, merged dates, cash advances and salaries, without subtotal transactions', () => {
  const s = sheet({ B1: 'EXPENSES DUMP TRUCK', B2: 'April 01,2025', C2: 'Canter', D2: 'Diesel', E2: 100,
    C3: 'Canter', D3: 'Maintenance', E3: 50, B4: 'April 02,2025', C4: 'CA', B5: 'DRIVERS', C5: 10, E5: 10,
    B6: 'April 05,2025', C6: 'SALARY', B7: 'DRIVERS', C7: 20, E7: 20, B8: 'TOTAL:', C8: 20, B9: 'TOTAL EXPENSES:', E9: 180,
    H1: 'EXPENSES DUMP TRUCK', H2: 'April 07,2025', I2: 'Canter', J2: 'Diesel', K2: 30, H3: 'TOTAL EXPENSES:', K3: 30 },
  [{ s: { r: 1, c: 1 }, e: { r: 2, c: 1 } }]);
  const result = parseAllWeeklyWorkbook({ SheetNames: ['APR WEEKLY', 'EMPTY WEEKLY'], Sheets: { 'APR WEEKLY': s, 'EMPTY WEEKLY': {} } }, source);
  assert.equal(result.records.length, 5);
  assert.equal(result.records[1].date, '2025-04-01');
  assert.equal(result.records.reduce((sum, row) => sum + row.amount, 0), 210);
  assert.equal(result.records.some(row => /TOTAL/.test(row.party)), false);
  assert.equal(result.sheets[0].blocks, 2);
  assert.equal(result.sheets[1].records, 0);
});

test('partial and separate 13th-month payments are included once and their totals are excluded', () => {
  const s = sheet({ B1: 'EXPENSES DUMP TRUCK', B2: 'Jan 03,2026', C2: 'partial 13th', B3: 'REMARK', C3: 500,
    B4: 'Jan 10,2026', C4: 'SALARY', D4: '13TH', B5: 'OPERATORS', C5: 100, D5: 50,
    B6: 'TOTAL:', C6: 100, D6: 50, B7: 'TOTAL EXPENSES:', E7: 650 });
  const result = parseAllWeeklyWorkbook({ SheetNames: ['JAN WEEKLY'], Sheets: { 'JAN WEEKLY': s } }, source);
  assert.equal(result.records.length, 3);
  assert.equal(result.records.filter(row => row.rawDescription.startsWith('13th Month')).length, 2);
  assert.equal(result.records.reduce((sum, row) => sum + row.amount, 0), 650);
});

test('bad dates and missing salary headings require explicit workbook-specific resolutions', () => {
  assert.equal(parseDate('Feb 31,2026'), null);
  assert.equal(parseDate('June 28/30,2025'), null);
  assert.equal(parseDate('M ay 17,2025'), '2025-05-17');
  const row = record({ rawDate: 'Feb 31,2026', issues: ['Invalid or missing date: Feb 31,2026'] });
  const report = { source, records: [row] };
  assert.throws(() => applyAllWeeklyResolutions(report, { workbookSha256: 'wrong' }), /different workbook/);
  const resolved = applyAllWeeklyResolutions(report, { workbookSha256: hash, rows: { [row.sourceLocator]: { originalDate: row.rawDate, date: '2026-01-31', reason: 'User delegated interpretation; printed January cutoff ends January 31.' } } });
  assert.equal(resolved.records[0].date, '2026-01-31');
  assert.equal(resolved.records[0].issues.length, 0);
  assert.equal(report.records[0].date, row.date);
  assert.ok(resolved.records[0].dateResolution.reason);
});

test('exact matches are reserved before weekly price corrections and admin rows are excluded', () => {
  const rows = [record({ amount: 50 }), record({ address: 'E3', sourceLocator: 'APR WEEKLY!E3:weekly-equipment', amount: 100 }),
    record({ section: 'salary', party: 'ADMIN' })];
  const plan = buildAllWeeklyImportPlan({ records: rows }, state([saved({})]), 'exclude-all', true);
  assert.equal(plan.newRecords.length, 1);
  assert.equal(plan.newRecords[0].amount, 50);
  assert.equal(plan.updates.length, 0);
  assert.equal(plan.excluded.length, 1);
});

test('price and category conflicts update existing expenses only when weekly precedence is selected', () => {
  const rows = [record({ amount: 50 })];
  assert.equal(buildAllWeeklyImportPlan({ records: rows }, state([saved({})]), 'exclude-all').held.length, 1);
  const plan = buildAllWeeklyImportPlan({ records: rows }, state([saved({})]), 'exclude-all', true);
  assert.equal(plan.updates.length, 1);
  assert.equal(plan.newRecords.length, 0);
  assert.equal(plan.updates[0].expense.amount, 100);
  assert.equal(plan.updates[0].row.amount, 50);
});

test('weekly aggregate costs reuse the matching itemized expenses and copied source rows are not imported twice', () => {
  const rows = [record({ amount: 850 }), record({ address: 'E3', sourceLocator: 'APR WEEKLY!E3:weekly-equipment', amount: 850 })];
  const plan = buildAllWeeklyImportPlan({ records: rows }, state([saved({ amount: 180 }), saved({ id: 'second', amount: 670 })]), 'exclude-all', true);
  assert.equal(plan.assigned.length, 1);
  assert.equal(plan.assigned[0].ids.length, 2);
  assert.equal(plan.newRecords.length, 0);
  assert.equal(plan.duplicates.length, 1);
});

test('repeat imports use saved source locators and reject changed amounts rather than adding duplicate transactions', () => {
  const row = record({});
  const expense = saved({ notes: `Historical import; source: ${row.sourceLocator};` });
  assert.equal(buildAllWeeklyImportPlan({ records: [row] }, state([expense]), 'exclude-all', true).newRecords.length, 0);
  assert.equal(buildAllWeeklyImportPlan({ records: [row] }, state([{ ...expense, amount: 75 }]), 'exclude-all', true).held.length, 1);
});

test('admin exclusion checks role, source provenance, and current version before its versioned RPC', async () => {
  const { excludeImportedWeeklyAdminExpensesAction: exclude } = load('actions/gmeaWeeklyAdminExclusion.ts');
  const row = { id, version: 2, notes: 'Historical import; source: JAN WEEKLY!C45:weekly-salary;', supplier: 'ADMIN', description: 'Salary - ADMIN' };
  const calls = [];
  let active = true, current = row;
  const db = { from(table) { return { select() { return this; }, eq() { return this; }, async single() { return { data: table === 'profiles' ? { role: active ? 'gmea' : 'ceo', is_active: true } : current }; } }; },
    async rpc(name, args) { calls.push({ name, args }); return { data: id }; } };
  active = false;
  await assert.rejects(exclude(db, id, [row], () => {}), /active GMEA/);
  active = true;
  await assert.rejects(exclude(db, id, [{ ...row, supplier: 'Driver' }], () => {}), /source-verified/);
  current = { ...row, version: 3 };
  await assert.rejects(exclude(db, id, [row], () => {}), /changed after review/);
  assert.equal(calls.length, 0);
  current = row;
  const applied = [];
  await exclude(db, id, [row], id => applied.push(id));
  assert.equal(calls[0].args.p_version, 2);
  assert.equal(calls[0].args.p_command.kind, 'delete');
  assert.deepEqual(applied, [id]);
});
