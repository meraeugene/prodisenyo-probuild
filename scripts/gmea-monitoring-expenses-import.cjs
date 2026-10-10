#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const esbuild = require("esbuild");
const { loadEnvConfig } = require("@next/env");
const { createClient } = require("@supabase/supabase-js");
const { readMonitoringWorkbook } = require("./lib/gmeaMonitoringWorkbook.cjs");
const { readGmeaImportProjects } = require("./lib/readGmeaImportProjects.cjs");

async function main() {
  const args = process.argv.slice(2), fileIndex = args.indexOf("--file");
  if (fileIndex < 0 || !args[fileIndex + 1]) throw new Error("Provide --file with the project monitoring workbook path. Default mode is read-only.");
  const filename = path.resolve(args[fileIndex + 1]), apply = args.includes("--apply");
  loadEnvConfig(process.cwd());
  const workbook = readMonitoringWorkbook(filename);
  const directory = path.resolve("tmp/design-preview");
  fs.mkdirSync(directory, { recursive: true });
  const runtime = path.join(directory, "gmea-monitoring-import-runtime.cjs");
  await esbuild.build({ stdin: { contents: 'export * from "./features/gmea-projects/utils/monitoringExpenseImport"; export * from "./features/gmea-projects/utils/gmeaCalculations"; export * from "./actions/gmeaContractReconciliation";', resolveDir: process.cwd(), loader: "ts" }, bundle: true, platform: "node", format: "cjs", packages: "external", outfile: runtime });
  const { buildMonitoringExpensePlans, verifyMonitoringExpenseResult, applyGmeaContractReconciliation, projectExpenseTotal, sumMoney } = require(runtime);
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const projects = await readGmeaImportProjects(db);
  const { plans, held } = buildMonitoringExpensePlans(workbook.sheets, projects);
  const completionFile = path.join(directory, `gmea-monitoring-completed-${workbook.source.sha256}.json`);
  if (apply && fs.existsSync(completionFile) && plans.some((plan) => plan.commands.length)) throw new Error("This workbook was already imported. Review later project edits rather than applying the old source again.");
  const report = { source: workbook.source, sheets: workbook.sheets.map((sheet) => ({ title: sheet.title, itemizedTotal: sheet.total, displayedTotal: sheet.displayedTotal, skippedSubtotals: sheet.ignored })), plans, held };
  fs.writeFileSync(path.join(directory, "gmea-monitoring-import-plan.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", projects: plans.map((plan) => ({ title: plan.title, added: plan.added.map((item) => ({ description: item.description, amount: item.amount, date: item.date || null, invoice: item.invoice_number })), corrections: plan.corrections, matched: plan.matched, replacedBalance: plan.replacedBalance, beforeTotal: plan.beforeTotal, expectedTotal: plan.expectedTotal, operations: plan.commands.length })), held }, null, 2));
  if (!apply) return;
  const cctv = plans.find((plan) => plan.title === "CVH- CCTV NETWORK");
  if (cctv && cctv.expectedTotal !== cctv.beforeTotal && !args.includes("--itemized-cctv")) throw new Error("Confirm using itemized CCTV costs with --itemized-cctv. Its displayed SUM omits a text amount.");
  const { data: actors, error } = await db.from("profiles").select("id").eq("role", "gmea").eq("is_active", true).limit(2);
  if (error || actors?.length !== 1) throw new Error("Exactly one active GMEA account is required for an attributable import.");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.join(directory, `gmea-monitoring-before-${stamp}.json`), journal = path.join(directory, `gmea-monitoring-applied-${stamp}.jsonl`);
  fs.writeFileSync(backup, JSON.stringify({ ...report, actor: actors[0].id, projects }, null, 2), { flag: "wx" });
  fs.writeFileSync(journal, "", { flag: "wx" });
  const sourceHash = () => crypto.createHash("sha256").update(fs.readFileSync(filename)).digest("hex");
  if (sourceHash() !== workbook.source.sha256) throw new Error("Workbook changed before import.");
  await applyGmeaContractReconciliation(db, actors[0].id, plans, (project, version) => fs.appendFileSync(journal, JSON.stringify({ project, version, applied_at: new Date().toISOString() }) + "\n"));
  const result = await readGmeaImportProjects(db);
  verifyMonitoringExpenseResult(plans, result);
  for (const original of projects) {
    const updated = result.find((project) => project.id === original.id);
    if (!updated || original.contract_amount !== updated.contract_amount || original.status !== updated.status || JSON.stringify(original.payment_terms) !== JSON.stringify(updated.payment_terms)) throw new Error("Contract or payment history changed during expense import.");
  }
  if (sourceHash() !== workbook.source.sha256) throw new Error("Workbook changed outside this import.");
  const summary = { verified: true, workbookUnchanged: true, added: plans.reduce((sum, plan) => sum + plan.added.length, 0),
    addedItemAmounts: sumMoney(plans.flatMap((plan) => plan.added.map((item) => item.amount))), replacedBalance: sumMoney(plans.map((plan) => plan.replacedBalance)),
    expenses: sumMoney(result.map(projectExpenseTotal)), held, backup, journal };
  fs.writeFileSync(completionFile, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
