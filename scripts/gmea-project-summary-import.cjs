const fs = require("node:fs");
const path = require("node:path");
const esbuild = require("esbuild");
const crypto = require("node:crypto");
const { loadEnvConfig } = require("@next/env");
const { createClient } = require("@supabase/supabase-js");
const { readContractWorkbook } = require("./lib/gmeaContractWorkbook.cjs");
const { readGmeaImportProjects } = require("./lib/readGmeaImportProjects.cjs");

async function main() {
  const args = process.argv.slice(2), file = args[args.indexOf("--file") + 1];
  if (!args.includes("--file") || !file) throw new Error("Provide --file. Default mode is read-only.");
  const workbook = readContractWorkbook(path.resolve(file));
  loadEnvConfig(process.cwd());
  const dir = path.resolve("tmp/design-preview");
  fs.mkdirSync(dir, { recursive: true });
  const runtime = path.join(dir, "gmea-project-summary-runtime.cjs");
  await esbuild.build({ stdin: { contents: 'export * from "./features/gmea-projects/utils/projectSummaryWorkbookPlan"; export * from "./actions/gmeaContractReconciliation";', resolveDir: process.cwd(), loader: "ts" }, bundle: true, platform: "node", format: "cjs", packages: "external", outfile: runtime });
  const { buildProjectSummaryWorkbookPlans, applyGmeaContractReconciliation } = require(runtime);
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const projects = await readGmeaImportProjects(db);
  // Keep the original provenance timestamp for an already imported source.
  const existingSource = projects.flatMap(project => project.payment_terms).find(term => term.summary_source?.sha256 === workbook.source.sha256)?.summary_source;
  if (existingSource) workbook.source.imported_at = existingSource.imported_at;
  const plans = buildProjectSummaryWorkbookPlans(workbook.records, projects, workbook.source);
  console.log(JSON.stringify(plans.map(plan => ({ title: plan.title, details: plan.details, percentages: plan.percentages, operations: plan.commands.length })), null, 2));
  fs.writeFileSync(path.join(dir, "gmea-project-summary-plan.json"), JSON.stringify({ source: workbook.source, plans }, null, 2));
  if (!args.includes("--apply")) return;
  const { data: actors, error } = await db.from("profiles").select("id").eq("role", "gmea").eq("is_active", true).limit(2);
  if (error || actors?.length !== 1) throw new Error("Require exactly one active GMEA account.");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.join(dir, `gmea-project-summary-before-${stamp}.json`), journal = path.join(dir, `gmea-project-summary-applied-${stamp}.jsonl`);
  fs.writeFileSync(backup, JSON.stringify({ source: workbook.source, projects, plans }, null, 2), { flag: "wx" });
  fs.writeFileSync(journal, "", { flag: "wx" });
  const hash = () => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  if (hash() !== workbook.source.sha256) throw new Error("Workbook changed before import.");
  await applyGmeaContractReconciliation(db, actors[0].id, plans, (id, version) => fs.appendFileSync(journal, JSON.stringify({ id, version }) + "\n"));
  const after = await readGmeaImportProjects(db);
  for (const plan of plans) {
    const original = projects.find(project => project.id === plan.id), updated = after.find(project => project.id === plan.id);
    if (Object.entries(plan.details).some(([key, value]) => updated[key] !== value)) throw new Error("Project details do not match.");
    const financial = project => ({ contract: project.contract_amount, tax: project.tax_rate, status: project.status, expenses: project.expenses,
      terms: project.payment_terms.map(({ display_percentage, summary_source, ...term }) => term) });
    if (JSON.stringify(financial(original)) !== JSON.stringify(financial(updated))) throw new Error("Financial data changed unexpectedly.");
    if (updated.payment_terms.some((term, index) => term.display_percentage !== plan.percentages[index])) throw new Error("Percentage labels do not match.");
  }
  if (hash() !== workbook.source.sha256) throw new Error("Workbook changed outside import.");
  if (buildProjectSummaryWorkbookPlans(workbook.records, after, workbook.source).some(plan => plan.commands.length)) throw new Error("Repeat import is not empty.");
  console.log(JSON.stringify({ verified: true, projects: plans.length, financialDataUnchanged: true, workbookUnchanged: true, backup, journal }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
