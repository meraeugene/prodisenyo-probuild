const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const Module = require("node:module");
const XLSX = require("xlsx");
const {transformSync} = require("esbuild");

function loadTypescript(relative) {
  const filename = path.resolve(relative);
  const compiled = transformSync(fs.readFileSync(filename,"utf8"), {loader:"ts",format:"cjs"}).code;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = module.paths;
  mod._compile(compiled,filename);
  return mod.exports;
}
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
async function readRows(db, table) {
  const rows = [];
  for (let from=0;;from+=500) {
    const {data,error} = await db.from(table).select("*").range(from,from+499);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < 500) return rows.sort((a,b)=>String(a.id ?? a.source_hash).localeCompare(String(b.id ?? b.source_hash)));
  }
}
async function main() {
  const source = process.argv.find(arg => arg.endsWith(".xlsx")) || "C:\\Users\\Lenovo\\Downloads\\Gmea Customer (1).xlsx";
  const bytes = fs.readFileSync(source);
  const sourceHash = hash(bytes);
  const workbook = XLSX.read(bytes,{type:"buffer",cellDates:false});
  const snapshot = {};
  const merges = {};
  for (const name of workbook.SheetNames) {
    snapshot[name] = {};
    const sheet = workbook.Sheets[name];
    merges[name] = sheet["!merges"] || [];
    for (const [address,cell] of Object.entries(sheet)) if (!address.startsWith("!") && cell.v !== undefined) {
      snapshot[name][address] = {v:cell.v,...(cell.f ? {f:cell.f} : {})};
    }
  }
  const {parseCustomerIncomeWorkbook} = loadTypescript("features/gmea-rentals/utils/parseCustomerIncomeWorkbook.ts");
  const batch = parseCustomerIncomeWorkbook(snapshot,sourceHash,path.basename(source));
  batch.source_snapshot = {sheets:snapshot,merges,sheetNames:workbook.SheetNames};
  const monthly = {};
  let confirmed = 0, held = 0;
  for (const record of batch.records) for (const receipt of record.receipts) {
    if (!receipt.confirmed) { held++; continue; }
    confirmed++;
    const month = receipt.date.slice(0,7);
    monthly[month] = (monthly[month] || 0) + receipt.amount;
  }
  const report = {sourceHash,records:batch.records.length,confirmedReceipts:confirmed,heldEntries:held,
    recordsWithIssues:batch.records.filter(record=>record.issues.length).length,
    monthly:Object.fromEntries(Object.entries(monthly).sort()),
    totalCollected:Object.values(monthly).reduce((total,amount)=>total+amount,0)};
  const output = path.resolve("tmp/rental-income-import");
  fs.mkdirSync(output,{recursive:true});
  fs.writeFileSync(path.join(output,"customer-income-preview.json"),JSON.stringify({report,batch},null,2));
  console.log(JSON.stringify(report,null,2));
  if (!process.argv.includes("--apply")) return;
  require("@next/env").loadEnvConfig(process.cwd());
  const {createClient} = require("@supabase/supabase-js");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
  const tables = ["gmea_rentals","gmea_rental_payments","gmea_rental_equipment","gmea_rental_expenses","gmea_rental_historical_income"];
  const before = {};
  for (const table of tables) before[table] = await readRows(db,table);
  const importsBefore = await readRows(db,"gmea_rental_income_imports");
  const {data:actors,error:actorError} = await db.from("profiles").select("id").eq("role","gmea").eq("is_active",true);
  if (actorError || actors.length !== 1) throw new Error("Import requires exactly one active GMEA actor.");
  const auditFile = path.join(output,`before-${Date.now()}.json`);
  fs.writeFileSync(auditFile,JSON.stringify({before,importsBefore},null,2));
  fs.copyFileSync(source,path.join(output,`source-${sourceHash}.xlsx`));
  if (hash(fs.readFileSync(source)) !== sourceHash) throw new Error("Source changed before import.");
  const {importGmeaCustomerIncomeAction} = loadTypescript("actions/gmeaRentalIncomeImport.ts");
  await importGmeaCustomerIncomeAction(db,actors[0].id,batch);
  const importsAfter = await readRows(db,"gmea_rental_income_imports");
  const imported = importsAfter.find(row=>row.source_hash===sourceHash);
  const canonical = object => JSON.stringify(object, (_,v)=> v && !Array.isArray(v) && typeof v === "object"
    ? Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))) : v);
  if (!imported || canonical(imported.records)!==canonical(batch.records) || canonical(imported.source_snapshot)!==canonical(batch.source_snapshot)) throw new Error("Imported workbook did not match the reviewed payload.");
  for (const table of tables) {
    const after = await readRows(db,table);
    if (canonical(after)!==canonical(before[table])) throw new Error(`Unexpected change in ${table}. See ${auditFile}.`);
  }
  if (importsAfter.length !== importsBefore.length + (importsBefore.some(row=>row.source_hash===sourceHash) ? 0 : 1)) throw new Error("Unexpected import count.");
  if (hash(fs.readFileSync(source)) !== sourceHash) throw new Error("Source workbook changed.");
  fs.writeFileSync(path.join(output,"customer-income-import-result.json"),JSON.stringify({verified:true,report,importedAt:imported.imported_at,auditFile},null,2));
  console.log("Import verified: workbook preserved, existing rentals/equipment/expenses unchanged, duplicate-safe archive stored.");
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
