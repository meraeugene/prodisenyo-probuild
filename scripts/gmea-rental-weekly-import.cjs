const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {loadEnvConfig}=require('@next/env'),{createClient}=require('@supabase/supabase-js'),esbuild=require('esbuild');
const {readRentalWeeklyWorkbook}=require('./lib/rentalWeeklyWorkbook.cjs');
const {readRentalImportTable}=require('./lib/readGmeaRentalImportState.cjs');
const {buildRentalWeeklyImportPlans}=require('./lib/rentalWeeklyImportPlan.cjs');
async function main(){
  const args=process.argv.slice(2),file=args[args.indexOf('--file')+1];
  if(!args.includes('--file')||!file)throw new Error('Provide --file. Default is dry run.');
  const report=readRentalWeeklyWorkbook(file),dir=path.resolve('tmp/design-preview');fs.mkdirSync(dir,{recursive:true});
  const runtimeFile=path.join(dir,'rental-weekly-runtime.cjs');
  await esbuild.build({stdin:{contents:'export * from "./features/gmea-rentals/utils/rentalReportingWeeks"; export * from "./actions/gmeaRentalWeeklyImport"; export * from "./actions/gmeaRentalWorkbookImport";',resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',packages:'external',outfile:runtimeFile});
  const runtime=require(runtimeFile);loadEnvConfig(process.cwd());
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const tables=['gmea_rental_expenses','gmea_rental_equipment','gmea_rental_expense_categories','gmea_rentals','gmea_rental_items','gmea_rental_payments','gmea_rental_workers','gmea_rental_worker_assignments'];
  const state=Object.fromEntries(await Promise.all(tables.map(async table=>[table,await readRentalImportTable(db,table)])));
  const {plans,assigned}=buildRentalWeeklyImportPlans(report,state,runtime);
  const summary={mode:args.includes('--apply')?'APPLY':'DRY RUN',weeklyRows:assigned.length,weeks:report.weeks.length,newExpenses:plans.filter(p=>!p.version).length,updatedExpenses:plans.filter(p=>p.version).length,priceCorrections:plans.filter(p=>p.priceChanged).map(p=>({source:p.source,previous:p.previousAmount,amount:p.command.value.amount})),monthly: Object.fromEntries(['2026-08','2026-09'].map(month=>[month,report.weeks.filter(w=>w.month===month).reduce((sum,w)=>sum+Math.round(w.total*100),0)/100])),formulaDifferences:report.weeks.filter(w=>w.difference).map(w=>({start:w.start,listedTotal:w.total,formulaTotal:w.sourceTotal}))};
  fs.writeFileSync(path.join(dir,'rental-weekly-plan.json'),JSON.stringify({summary,report,plans},null,2));console.log(JSON.stringify(summary));
  if(!args.includes('--apply'))return;
  const {data:actors,error}=await db.from('profiles').select('id').eq('role','gmea').eq('is_active',true).limit(2);
  if(error||actors?.length!==1)throw new Error('Require exactly one active GMEA account.');
  const stamp=new Date().toISOString().replace(/[:.]/g,'-'),backup=path.join(dir,`rental-weekly-before-${stamp}.json`),journal=path.join(dir,`rental-weekly-applied-${stamp}.jsonl`);
  fs.writeFileSync(backup,JSON.stringify({report,state}),{flag:'wx'});fs.writeFileSync(journal,'',{flag:'wx'});
  await runtime.applyRentalWeeklyImportAction(db,actors[0].id,plans,(id,source)=>fs.appendFileSync(journal,JSON.stringify({id,source})+'\n'));
  await runtime.markRentalWorkbookNotificationsReadAction(db,actors[0].id,plans.map(p=>p.id));
  const after=await readRentalImportTable(db,'gmea_rental_expenses');
  if(after.length!==state.gmea_rental_expenses.length+summary.newExpenses)throw new Error('Unexpected expense count.');
  for(const original of state.gmea_rental_expenses.filter(item=>!plans.some(plan=>plan.id===item.id)))if(JSON.stringify(after.find(item=>item.id===original.id))!==JSON.stringify(original))throw new Error('Unrelated expense changed.');
  for(const {id,row} of assigned){const value=after.find(item=>item.id===id);if(!value||value.expense_date!==row.date||Math.round(Number(value.amount)*100)!==Math.round(row.amount*100)||JSON.stringify(runtime.rentalWeekMetadata(value.notes))!==JSON.stringify(row.week))throw new Error(`Source differs: ${id}`);}
  for(const table of tables.slice(1))if(JSON.stringify(await readRentalImportTable(db,table))!==JSON.stringify(state[table]))throw new Error(`Unrelated ${table} data changed.`);
  const weeks=runtime.buildRentalReportingWeeks(after.map(item=>({...item,date:item.expense_date,amount:Number(item.amount),refunded_amount:Number(item.refunded_amount),vat_rate:Number(item.vat_rate)})));
  for(const [month,total]of Object.entries(summary.monthly))if(runtime.sumRentalReportingMonth(weeks,month)!==total)throw new Error(`Monthly total differs: ${month}`);
  if(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==report.source.sha256)throw new Error('Workbook changed.');
  const verified={...summary,verified:true,backup,journal,workbookUnchanged:true};fs.writeFileSync(path.join(dir,'rental-weekly-verified.json'),JSON.stringify(verified,null,2));console.log(JSON.stringify(verified));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
