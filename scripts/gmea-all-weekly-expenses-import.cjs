const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const esbuild = require('esbuild'), { loadEnvConfig } = require('@next/env'), { createClient } = require('@supabase/supabase-js');
const { readAllWeeklyWorkbook } = require('./lib/allWeeklyWorkbook.cjs');
const { buildAllWeeklyImportPlan } = require('./lib/allWeeklyImportPlan.cjs');
const { readRentalImportTable } = require('./lib/readGmeaRentalImportState.cjs');
const { applyAllWeeklyResolutions, buildAllWeeklyUpdatePlans } = require('./lib/allWeeklyResolutions.cjs');
const sum = rows => rows.reduce((total, row) => total + Math.round(Number(row.amount) * 100), 0) / 100;
async function main() {
  const args = process.argv.slice(2), option = name => args.includes(name) ? args[args.indexOf(name) + 1] : null;
  const file = option('--file'), adminPolicy = option('--admin-policy');
  if (!file) throw new Error('Provide --file and --admin-policy include|exclude-salary|exclude-all. Default is dry run.');
  let report = readAllWeeklyWorkbook(file);
  const dir = path.resolve('tmp/design-preview');
  fs.mkdirSync(dir, { recursive: true });
  if (option('--resolutions')) report = applyAllWeeklyResolutions(report, JSON.parse(fs.readFileSync(option('--resolutions'), 'utf8')));
  const preferWeekly = args.includes('--prefer-weekly'), excludeExistingAdmin = args.includes('--exclude-existing-admin');
  if (excludeExistingAdmin && adminPolicy === 'include') throw new Error('Cannot exclude existing admin while including admin in the import.');
  loadEnvConfig(process.cwd());
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const tables = ['gmea_rental_expenses', 'gmea_rental_equipment', 'gmea_rental_expense_categories', 'gmea_rentals', 'gmea_rental_items', 'gmea_rental_payments', 'gmea_rental_workers', 'gmea_rental_worker_assignments'];
  const state = Object.fromEntries(await Promise.all(tables.map(async table => [table, await readRentalImportTable(db, table)])));
  const plan = buildAllWeeklyImportPlan(report, state, adminPolicy, preferWeekly);
  const updatePlans = buildAllWeeklyUpdatePlans(plan.updates);
  const adminExclusions = excludeExistingAdmin ? plan.excludedExisting : [];
  const summary = { mode: args.includes('--apply') ? 'APPLY' : 'DRY RUN', sourceSheets: report.sheets.length, populatedSheets: report.sheets.filter(sheet => sheet.records).length,
    sourceRows: report.records.length, existingExpenses: state.gmea_rental_expenses.length,
    matchedExisting: plan.assigned.filter(item => item.existing).length, newExpenses: plan.newRecords.length, newAmount: sum(plan.newRecords),
    verifiedSourceAmount: sum(plan.assigned.map(item => item.row)), duplicateSourceRows: plan.duplicates.length,
    updatedExpenses: updatePlans.length, removedAdminExpenses: adminExclusions.length, removedAdminAmount: sum(adminExclusions),
    excludedAdminRows: plan.excluded.length, incompleteTemplateRows: plan.incomplete.length, heldRows: plan.held.length, adminPolicy, workbookSha256: report.source.sha256 };
  const runtimeFile = path.join(dir, 'all-weekly-import-runtime.cjs');
  await esbuild.build({ stdin: { contents: 'export * from "./features/gmea-rentals/utils/rentalWorkbookImport"; export * from "./actions/gmeaRentalWorkbookImport"; export * from "./actions/gmeaRentalWeeklyImport"; export * from "./actions/gmeaWeeklyAdminExclusion"; export { normalizeRentalExpenseMutation } from "./features/gmea-rentals/utils/operationsValidation";', resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', outfile: runtimeFile });
  const runtime = require(runtimeFile);
  const plans = runtime.buildRentalWorkbookExpensePlans(plan.newRecords, state.gmea_rental_expense_categories, state.gmea_rental_equipment);
  for (const item of plans) if (item.record.dateResolution) item.command.value.notes += `; date-resolution:${JSON.stringify(item.record.dateResolution)}; original-date:${item.record.rawDate}`;
  [...plans, ...updatePlans].forEach(item => runtime.normalizeRentalExpenseMutation(item.command));
  fs.writeFileSync(path.join(dir, 'all-weekly-import-plan.json'), JSON.stringify({ summary, report, plan, plans, updatePlans, adminExclusions }, null, 2));
  fs.writeFileSync(path.join(dir, 'all-weekly-import-state.json'), JSON.stringify(state));
  console.log(JSON.stringify(summary));
  if (!args.includes('--apply')) return;
  const { data: actors, error } = await db.from('profiles').select('id').eq('role', 'gmea').eq('is_active', true).limit(2);
  if (error || actors?.length !== 1) throw new Error('Require exactly one active GMEA account.');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = path.join(dir, `all-weekly-before-${stamp}.json`), journal = path.join(dir, `all-weekly-applied-${stamp}.jsonl`);
  fs.writeFileSync(backup, JSON.stringify({ source: report.source, summary, state, plan }), { flag: 'wx' });
  fs.writeFileSync(journal, '', { flag: 'wx' });
  const hash = () => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if (hash() !== report.source.sha256) throw new Error('Workbook changed before import.');
  await runtime.applyRentalWorkbookExpensesAction(db, actors[0].id, plans, (id, source) => fs.appendFileSync(journal, JSON.stringify({ id, source }) + '\n'));
  await runtime.applyRentalWeeklyImportAction(db, actors[0].id, updatePlans, (id, source) => fs.appendFileSync(journal, JSON.stringify({ kind: 'weekly-correction', id, source }) + '\n'));
  await runtime.excludeImportedWeeklyAdminExpensesAction(db, actors[0].id, adminExclusions, id => fs.appendFileSync(journal, JSON.stringify({ kind: 'admin-exclusion', id }) + '\n'));
  await runtime.markRentalWorkbookNotificationsReadAction(db, actors[0].id, plans.map(item => item.record.id));
  const after = await readRentalImportTable(db, 'gmea_rental_expenses');
  if (after.length !== state.gmea_rental_expenses.length + plans.length - adminExclusions.length) throw new Error('Unexpected expense count after import.');
  const changedIds = new Set([...updatePlans, ...adminExclusions].map(item => item.id));
  for (const row of state.gmea_rental_expenses.filter(row => !changedIds.has(row.id))) if (JSON.stringify(after.find(item => item.id === row.id)) !== JSON.stringify(row)) throw new Error(`Unrelated expense changed: ${row.id}`);
  for (const item of updatePlans) {
    const saved = after.find(row => row.id === item.id), value = item.command.value;
    if (!saved || saved.description !== value.description || saved.category_id !== value.category_id || saved.notes !== value.notes) throw new Error(`Weekly correction does not match: ${item.source}`);
  }
  if (adminExclusions.some(item => after.some(row => row.id === item.id))) throw new Error('An excluded admin expense remains.');
  for (const item of plan.assigned) {
    const saved = (item.ids || [item.id]).map(id => after.find(row => row.id === id));
    if (saved.some(row => !row || row.expense_date !== item.row.date) || Math.round(sum(saved) * 100) !== Math.round(item.row.amount * 100)) throw new Error(`Source does not match saved expense: ${item.row.sourceLocator}`);
  }
  for (const table of tables.slice(1)) if (JSON.stringify(await readRentalImportTable(db, table)) !== JSON.stringify(state[table])) throw new Error(`Unrelated table changed: ${table}`);
  const repeat = buildAllWeeklyImportPlan(report, { ...state, gmea_rental_expenses: after }, adminPolicy, preferWeekly);
  if (repeat.newRecords.length || repeat.updates.length || excludeExistingAdmin && repeat.excludedExisting.length) throw new Error('Repeat import would change reconciled records.');
  if (hash() !== report.source.sha256) throw new Error('Workbook changed.');
  const verified = { ...summary, verified: true, totalExpenses: after.length, totalAmount: sum(after),
    workbookUnchanged: true, unrelatedExpensesUnchanged: true, repeatNewExpenses: repeat.newRecords.length, repeatUpdates: repeat.updates.length, backup, journal };
  fs.writeFileSync(path.join(dir, `all-weekly-verified-${stamp}.json`), JSON.stringify(verified, null, 2));
  fs.writeFileSync(path.join(dir, 'all-weekly-import-verified.json'), JSON.stringify(verified, null, 2));
  console.log(JSON.stringify(verified));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
