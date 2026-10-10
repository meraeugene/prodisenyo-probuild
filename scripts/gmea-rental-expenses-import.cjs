const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const esbuild = require("esbuild");
const { loadEnvConfig } = require("@next/env");
const { createClient } = require("@supabase/supabase-js");
const { readRentalImportTable } = require("./lib/readGmeaRentalImportState.cjs");

const cents = amount => Math.round(Number(amount) * 100);
const sum = rows => rows.reduce((total, row) => total + cents(row.amount), 0) / 100;
const fingerprint = row => row.notes.match(/source-fingerprint:([a-f0-9]{64})/)?.[1];
const locator = row => row.notes.match(/source: ([^;]+);/)?.[1];
const uuid = name => {
  const hex = crypto.createHash("sha256").update(name).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

async function main() {
  const args = process.argv.slice(2), reportFile = args[args.indexOf("--report") + 1];
  if (!args.includes("--report") || !reportFile) throw new Error("Provide --report from the workbook analysis. Default is dry run.");
  const report = JSON.parse(fs.readFileSync(reportFile, "utf8").replace(/^\uFEFF/, ""));
  const hash = () => crypto.createHash("sha256").update(fs.readFileSync(report.workbook.path)).digest("hex");
  if (hash() !== report.workbook.sha256) throw new Error("Workbook has changed. Analyze it again first.");
  if (report.readyRecords.length !== report.totals.readyForImport || report.readyRecords.some(row => row.issues.length)) throw new Error("Invalid reviewed record set.");
  loadEnvConfig(process.cwd());
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const dir = path.resolve("tmp/design-preview");
  fs.mkdirSync(dir, { recursive: true });
  const runtime = path.join(dir, "rental-workbook-import-runtime.cjs");
  await esbuild.build({ stdin: { contents: 'export * from "./features/gmea-rentals/utils/rentalWorkbookImport"; export * from "./actions/gmeaRentalWorkbookImport"; export * from "./features/gmea-rentals/utils/rentalExpensePeriods";', resolveDir: process.cwd(), loader: "ts" }, bundle: true, platform: "node", format: "cjs", packages: "external", outfile: runtime });
  const { rentalWorkbookEquipmentInputs, buildRentalWorkbookExpensePlans, createRentalWorkbookEquipmentAction, applyRentalWorkbookExpensesAction, markRentalWorkbookNotificationsReadAction, rentalExpensePeriodRange } = require(runtime);
  const tables = ["gmea_rental_equipment", "gmea_rental_expense_categories", "gmea_rental_expenses", "gmea_rentals", "gmea_rental_items", "gmea_rental_payments", "gmea_rental_workers", "gmea_rental_worker_assignments"];
  const state = Object.fromEntries(await Promise.all(tables.map(async table => [table, await readRentalImportTable(db, table)])));
  const existing = state.gmea_rental_expenses;
  const newRecords = report.readyRecords.filter(row => {
    const matches = existing.filter(item => item.id === row.id || locator(item) === row.sourceLocator);
    if (!matches.length) return true;
    if (matches.length !== 1 || matches[0].id !== row.id || fingerprint(matches[0]) !== row.sourceFingerprint) throw new Error(`Imported source differs: ${row.sourceLocator}`);
    return false;
  });
  const equipmentInputs = rentalWorkbookEquipmentInputs(newRecords, state.gmea_rental_equipment);
  const virtualEquipment = [...state.gmea_rental_equipment, ...equipmentInputs.map(item => ({ ...item, id: uuid(`preflight:${item.code}`) }))];
  buildRentalWorkbookExpensePlans(report.readyRecords, state.gmea_rental_expense_categories, virtualEquipment);
  const summary = { mode: args.includes("--apply") ? "APPLY" : "DRY RUN", readyExpenses: report.readyRecords.length,
    newExpenses: newRecords.length, alreadyImported: report.readyRecords.length - newRecords.length,
    newEquipment: equipmentInputs.length, heldExpenses: report.totals.blockedRecords,
    importAmount: sum(newRecords), workbookSha256: report.workbook.sha256 };
  console.log(JSON.stringify(summary));
  if (!args.includes("--apply")) return;
  const { data: actors, error } = await db.from("profiles").select("id").eq("role", "gmea").eq("is_active", true).limit(2);
  if (error || actors?.length !== 1) throw new Error("Require exactly one active GMEA account for this import.");
  const actor = actors[0].id, stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.join(dir, `rental-workbook-before-${stamp}.json`), journal = path.join(dir, `rental-workbook-applied-${stamp}.jsonl`);
  fs.writeFileSync(backup, JSON.stringify({ source: report.workbook, state, report }), { flag: "wx" });
  fs.writeFileSync(journal, "", { flag: "wx" });
  if (hash() !== report.workbook.sha256) throw new Error("Workbook changed before import.");
  await createRentalWorkbookEquipmentAction(db, actor, equipmentInputs, (id, name) => fs.appendFileSync(journal, JSON.stringify({ kind: "equipment", id, name }) + "\n"));
  const equipment = await readRentalImportTable(db, "gmea_rental_equipment");
  const plans = buildRentalWorkbookExpensePlans(newRecords, state.gmea_rental_expense_categories, equipment);
  let applied = 0;
  await applyRentalWorkbookExpensesAction(db, actor, plans, (id, source) => {
    fs.appendFileSync(journal, JSON.stringify({ kind: "expense", id, source }) + "\n");
    applied++;
    if (applied % 60 === 0) console.log(`Imported ${applied}/${plans.length} expenses`);
  });
  // Historical expenses should not flood the CEO's new-expense notification list.
  await markRentalWorkbookNotificationsReadAction(db, actor, report.readyRecords.map(record => record.id));
  const after = await readRentalImportTable(db, "gmea_rental_expenses");
  if (after.length !== existing.length + newRecords.length) throw new Error("Unexpected expense count after import.");
  for (const original of existing) {
    if (JSON.stringify(after.find(item => item.id === original.id)) !== JSON.stringify(original)) throw new Error(`Existing expense changed: ${original.id}`);
  }
  const allPlans = buildRentalWorkbookExpensePlans(report.readyRecords, state.gmea_rental_expense_categories, equipment);
  for (const { record, command } of allPlans) {
    if (command.kind !== "create") throw new Error("Unexpected import command.");
    const row = after.find(item => item.id === record.id), value = command.value;
    if (!row || fingerprint(row) !== record.sourceFingerprint || locator(row) !== record.sourceLocator || row.expense_date !== record.date
      || cents(row.amount) !== cents(record.amount) || row.equipment_id !== value.equipment_id || row.category_id !== value.category_id
      || row.description !== value.description || row.supplier !== value.supplier || row.rental_id !== null
      || row.vat_mode !== "off" || Number(row.vat_rate) !== 0 || Number(row.refunded_amount) !== 0) throw new Error(`Imported data does not match source: ${record.sourceLocator}`);
  }
  for (const table of tables.slice(3)) {
    if (JSON.stringify(await readRentalImportTable(db, table)) !== JSON.stringify(state[table])) throw new Error(`Existing ${table} data changed.`);
  }
  const months = new Map(), weeks = new Map();
  for (const record of report.readyRecords) {
    const month = record.date.slice(0, 7), week = rentalExpensePeriodRange("week", record.date).start;
    months.set(month, (months.get(month) || 0) + cents(record.amount));
    weeks.set(week, (weeks.get(week) || 0) + cents(record.amount));
  }
  if (hash() !== report.workbook.sha256) throw new Error("Workbook changed outside the import.");
  const verified = { ...summary, verified: true, applied, totalExpenses: after.length, totalImportedAmount: sum(report.readyRecords),
    monthlyPeriods: months.size, weeklyPeriods: weeks.size, workbookUnchanged: true, existingRentalRecordsUnchanged: true,
    backup, journal, monthlyAmounts: Object.fromEntries([...months].sort().map(([key, amount]) => [key, amount / 100])),
    weeklyAmounts: Object.fromEntries([...weeks].sort().map(([key, amount]) => [key, amount / 100])) };
  fs.writeFileSync(path.join(dir, "rental-workbook-import-verified.json"), JSON.stringify(verified, null, 2));
  console.log(JSON.stringify({ ...verified, monthlyAmounts: undefined, weeklyAmounts: undefined }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
