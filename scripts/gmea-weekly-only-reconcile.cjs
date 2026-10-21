const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { loadEnvConfig } = require('@next/env'), { createClient } = require('@supabase/supabase-js'), esbuild = require('esbuild');
const { readAllWeeklyWorkbook } = require('./lib/allWeeklyWorkbook.cjs');
const { applyAllWeeklyResolutions } = require('./lib/allWeeklyResolutions.cjs');
const { buildWeeklyOnlyReconciliation } = require('./lib/weeklyOnlyReconciliation.cjs');
const { readRentalImportTable } = require('./lib/readGmeaRentalImportState.cjs');
async function main() {
  const args = process.argv.slice(2), option = name => args.includes(name) ? args[args.indexOf(name) + 1] : null;
  const file = option('--file'), resolutionFile = option('--resolutions');
  if (!file || !resolutionFile) throw new Error('Provide --file and --resolutions. Default is dry run.');
  const report = applyAllWeeklyResolutions(readAllWeeklyWorkbook(file), JSON.parse(fs.readFileSync(resolutionFile, 'utf8')));
  const dir = path.resolve('tmp/design-preview'); fs.mkdirSync(dir, { recursive: true });
  const runtimeFile = path.join(dir, 'weekly-only-runtime.cjs');
  await esbuild.build({ stdin: { contents: 'export * from "./features/gmea-rentals/utils/rentalWorkbookWeeks"; export * from "./features/gmea-rentals/utils/rentalReportingWeeks"; export * from "./features/gmea-rentals/utils/operationsValidation"; export * from "./actions/gmeaRentalWeeklyImport"; export * from "./actions/gmeaWeeklySourceExclusion"; export * from "./actions/gmeaRentalWorkbookImport";', loader: 'ts', resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', outfile: runtimeFile });
  const runtime = require(runtimeFile); loadEnvConfig(process.cwd());
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const tables = ['gmea_rental_expenses', 'gmea_rental_equipment', 'gmea_rental_expense_categories', 'gmea_rentals', 'gmea_rental_items', 'gmea_rental_payments', 'gmea_rental_workers', 'gmea_rental_worker_assignments'];
  const state = Object.fromEntries(await Promise.all(tables.map(async table => [table, await readRentalImportTable(db, table)])));
  const plan = buildWeeklyOnlyReconciliation(report, state, runtime);
  const summary = { mode: args.includes('--apply') ? 'APPLY' : 'DRY RUN', ...plan.summary, beforeCount: state.gmea_rental_expenses.length };
  fs.writeFileSync(path.join(dir, 'weekly-only-plan.json'), JSON.stringify({ summary, report, plan }, null, 2));
  fs.writeFileSync(path.join(dir, 'weekly-only-state.json'), JSON.stringify(state));
  console.log(JSON.stringify(summary));
  if (!args.includes('--apply')) return;
  const { data: actors, error } = await db.from('profiles').select('id').eq('role', 'gmea').eq('is_active', true).limit(2);
  if (error || actors?.length !== 1) throw new Error('Require exactly one active GMEA account.');
  const hash = () => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-'), backup = path.join(dir, `weekly-only-before-${stamp}.json`), journal = path.join(dir, `weekly-only-applied-${stamp}.jsonl`);
  fs.writeFileSync(backup, JSON.stringify({ source: report.source, state, plan }), { flag: 'wx' }); fs.writeFileSync(journal, '', { flag: 'wx' });
  if (hash() !== report.source.sha256) throw new Error('Workbook changed before reconciliation.');
  await runtime.applyRentalWeeklyImportAction(db, actors[0].id, plan.updates, (id, source) => fs.appendFileSync(journal, JSON.stringify({ kind: 'weekly-source', id, source }) + '\n'));
  await runtime.excludeNonWeeklyWorkbookExpensesAction(db, actors[0].id, plan.removals, id => fs.appendFileSync(journal, JSON.stringify({ kind: 'excluded-import', id }) + '\n'));
  await runtime.markRentalWorkbookNotificationsReadAction(db, actors[0].id, plan.updates.map(item => item.id));
  const after = await readRentalImportTable(db, 'gmea_rental_expenses');
  if (after.length !== state.gmea_rental_expenses.length - plan.removals.length) throw new Error('Expense count differs after reconciliation.');
  for (const item of plan.sourcePlan.assigned) {
    const saved = after.find(row => row.id === item.id), week = saved && runtime.rentalWorkbookWeekMetadata(saved.notes);
    if (!saved || !week || week.month !== item.row.cutoff.month || week.start !== item.row.cutoff.start || week.end !== item.row.cutoff.end
      || saved.expense_date !== item.row.date || Math.round(Number(saved.amount) * 100) !== Math.round(item.row.amount * 100)) throw new Error(`Saved weekly source differs: ${item.row.sourceLocator}`);
  }
  const changed = new Set([...plan.updates, ...plan.removals].map(item => item.id));
  for (const row of state.gmea_rental_expenses.filter(row => !changed.has(row.id))) if (JSON.stringify(after.find(item => item.id === row.id)) !== JSON.stringify(row)) throw new Error(`Unrelated expense changed: ${row.id}`);
  for (const table of tables.slice(1)) if (JSON.stringify(await readRentalImportTable(db, table)) !== JSON.stringify(state[table])) throw new Error(`Unrelated table changed: ${table}`);
  const weeks = runtime.buildRentalReportingWeeks(after.map(row => ({ ...row, date: row.expense_date, amount: Number(row.amount), refunded_amount: Number(row.refunded_amount), vat_rate: Number(row.vat_rate) })));
  for (const [month, amount] of Object.entries(plan.summary.monthlyAmounts)) if (runtime.sumRentalReportingMonth(weeks, month) !== amount) throw new Error(`Monthly total differs: ${month}`);
  const repeat = buildWeeklyOnlyReconciliation(report, { ...state, gmea_rental_expenses: after }, runtime);
  if (repeat.updates.length || repeat.removals.length) throw new Error('Repeat reconciliation is not empty.');
  if (hash() !== report.source.sha256) throw new Error('Workbook changed.');
  const verified = { ...summary, verified: true, totalExpenses: after.length, repeatUpdates: 0, repeatRemovals: 0, workbookUnchanged: true, unrelatedRecordsUnchanged: true, backup, journal };
  fs.writeFileSync(path.join(dir, 'weekly-only-verified.json'), JSON.stringify(verified, null, 2)); console.log(JSON.stringify(verified));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
