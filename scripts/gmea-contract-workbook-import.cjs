#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { loadEnvConfig } = require("@next/env");
const { createClient } = require("@supabase/supabase-js");
const esbuild = require("esbuild");
const { readContractWorkbook, stableId } = require("./lib/gmeaContractWorkbook.cjs");

async function all(db, table) {
  const rows = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await db.from(table).select("*").order("id").range(from, from + 499);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}

async function readProjects(db) {
  const [projects, expenses, terms, receipts, partners] = await Promise.all([
    "gmea_projects", "gmea_expenses", "gmea_collections", "gmea_collection_receipts", "gmea_partners",
  ].map((table) => all(db, table)));
  return projects.map((project) => ({ ...project, contract_amount: Number(project.contract_amount), tax_rate: Number(project.tax_rate ?? 0),
    expenses: expenses.filter((row) => row.project_id === project.id).map((row) => ({ ...row.data, id: row.id })),
    payment_terms: terms.filter((row) => row.project_id === project.id).map((row) => ({ ...row.data, id: row.id,
      receipts: receipts.filter((receipt) => receipt.term_id === row.id).map((receipt) => ({ ...receipt, amount: Number(receipt.amount) })),
    })),
    partners: partners.filter((row) => row.project_id === project.id).map((row) => ({ ...row.data, id: row.id })),
  }));
}

async function main() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf("--file");
  if (fileIndex < 0 || !args[fileIndex + 1]) throw new Error("Provide --file with the authoritative workbook path. Default mode is read-only; --apply writes the prepared reconciliation.");
  const filename = path.resolve(args[fileIndex + 1]);
  const apply = args.includes("--apply");
  loadEnvConfig(process.cwd());
  const imported = readContractWorkbook(filename);
  const directory = path.resolve("tmp/design-preview");
  fs.mkdirSync(directory, { recursive: true });
  const runtime = path.join(directory, "gmea-contract-import-runtime.cjs");
  await esbuild.build({ stdin: { contents: 'export * from "./features/gmea-projects/utils/contractWorkbookReconciliation"; export * from "./features/gmea-projects/utils/gmeaCalculations"; export * from "./actions/gmeaContractReconciliation";', resolveDir: process.cwd(), loader: "ts" }, bundle: true, platform: "node", format: "cjs", packages: "external", outfile: runtime });
  const { buildContractWorkbookPlan, verifyContractWorkbookResult, applyGmeaContractReconciliation, projectExpenseTotal, contractCollectionSummary, sumMoney } = require(runtime);
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const projects = await readProjects(db);
  const plans = buildContractWorkbookPlan(imported.records, projects, imported.source, stableId);
  const completionFile = path.join(directory, `gmea-contract-completed-${imported.source.sha256}.json`);
  if (apply && fs.existsSync(completionFile) && plans.some((plan) => plan.commands.length)) {
    throw new Error("This workbook was already reconciled. Later project edits require review or an updated source; the original workbook will not overwrite them.");
  }
  const planFile = path.join(directory, "gmea-contract-reconciliation-plan.json");
  fs.writeFileSync(planFile, JSON.stringify({ source: imported.source, plans }, null, 2));
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", sourceSha256: imported.source.sha256,
    projects: plans.map((plan) => ({ title: plan.title, operations: plan.commands.map((command) => command.kind), expected: plan.expected })) }, null, 2));
  if (!apply) return;
  const { data: actors, error } = await db.from("profiles").select("id").eq("role", "gmea").eq("is_active", true).limit(2);
  if (error || actors?.length !== 1) throw new Error("Exactly one active GMEA account is required for an attributable import.");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.join(directory, `gmea-contract-before-${stamp}.json`);
  fs.writeFileSync(backup, JSON.stringify({ source: imported.source, actor: actors[0].id, projects, plans }, null, 2), { flag: "wx" });
  const journal = path.join(directory, `gmea-contract-applied-${stamp}.jsonl`);
  fs.writeFileSync(journal, "", { flag: "wx" });
  if (crypto.createHash("sha256").update(fs.readFileSync(filename)).digest("hex") !== imported.source.sha256) throw new Error("Source workbook changed during preparation.");
  await applyGmeaContractReconciliation(db, actors[0].id, plans, (project, version) => {
    fs.appendFileSync(journal, JSON.stringify({ project, version, applied_at: new Date().toISOString() }) + "\n");
  });
  const result = await readProjects(db);
  verifyContractWorkbookResult(plans, result);
  const matched = result.filter((project) => plans.some((plan) => plan.id === project.id));
  const totals = { contracts: sumMoney(matched.map((project) => project.contract_amount)), expenses: sumMoney(matched.map(projectExpenseTotal)),
    collected: sumMoney(matched.map((project) => contractCollectionSummary(project).received)), outstanding: sumMoney(matched.map((project) => contractCollectionSummary(project).outstanding)),
    completed: matched.filter((project) => project.status === "completed").length, ongoing: matched.filter((project) => project.status === "active").length };
  const afterHash = crypto.createHash("sha256").update(fs.readFileSync(filename)).digest("hex");
  if (afterHash !== imported.source.sha256) throw new Error("Source workbook changed outside this import.");
  fs.writeFileSync(completionFile, JSON.stringify({ source: imported.source, totals, backup, journal, verified_at: new Date().toISOString() }, null, 2));
  console.log(JSON.stringify({ verified: true, workbookUnchanged: true, totals, backup, journal }, null, 2));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
