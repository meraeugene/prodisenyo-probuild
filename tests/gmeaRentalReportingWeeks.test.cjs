const test=require('node:test'),assert=require('node:assert/strict');
const load=require('./helpers/loadGmeaModule.cjs');
const runtime=load('features/gmea-rentals/utils/rentalReportingWeeks.ts');
const {normalizeRentalExpenseMutation}=load('features/gmea-rentals/utils/operationsValidation.ts');
const {buildRentalWeeklyImportPlans}=require('../scripts/lib/rentalWeeklyImportPlan.cjs');
const id='11111111-1111-4111-8111-111111111111';
const meta={month:'2026-09',start:'2026-09-28',end:'2026-10-03',section:'equipment',party:'Bongo',source:{sheet:'SEPTEMBER WEEKLY',cell:'G89',sha256:'a'.repeat(64)}};
const expense=(overrides={})=>({id,rental_id:null,equipment_id:id,category_id:id,date:'2026-10-02',description:'Diesel',supplier:'',method:'',invoice_number:'',amount:2000,refunded_amount:0,vat_mode:'off',vat_rate:0,notes:runtime.encodeRentalWeekNotes('Original source',meta),version:2,...overrides});
test('weekly ranges retain cross-month dates and monthly totals sum whole assigned cutoffs',()=>{
 const rows=[expense(),expense({id:'second',date:'2026-09-28',amount:3360}),expense({id:'historical',notes:'Historical import;',amount:9000})];
 const weeks=runtime.buildRentalReportingWeeks(rows);
 assert.equal(weeks.length,1);assert.equal(weeks[0].total,5360);assert.equal(weeks[0].end,'2026-10-03');
 assert.equal(runtime.sumRentalReportingMonth(weeks,'2026-09'),5360);assert.equal(runtime.sumRentalReportingMonth(weeks,'2026-10'),0);
 assert.deepEqual(weeks[0].pending,['cash-advance','salary']);
});
test('August 1–9 is preserved and blank salary is not a fabricated zero transaction',()=>{
 const week={...meta,month:'2026-08',start:'2026-08-01',end:'2026-08-09'};
 const rows=[expense({date:'2026-08-02',notes:runtime.encodeRentalWeekNotes('',week)}),expense({id:'ca',date:'2026-08-05',amount:1000,notes:runtime.encodeRentalWeekNotes('',{...week,section:'cash-advance',party:'Drivers'})})];
 const result=runtime.buildRentalReportingWeeks(rows)[0];assert.equal(result.start,'2026-08-01');assert.equal(result.end,'2026-08-09');assert.equal(result.total,3000);assert.deepEqual(result.pending,['salary']);
});
test('invalid metadata and out-of-cutoff expense dates fail server normalization',()=>{
 assert.throws(()=>runtime.encodeRentalWeekNotes('',{...meta,start:'2026-09-31'}));
 assert.throws(()=>runtime.encodeRentalWeekNotes('',{...meta,month:'2026-10'}));
 assert.throws(()=>normalizeRentalExpenseMutation({kind:'create',value:expense({date:'2026-10-05'})}),/within/);
 assert.throws(()=>normalizeRentalExpenseMutation({kind:'create',value:expense({notes:'@rental-week:broken'})}),/Invalid weekly/);
 assert.equal(runtime.rentalExpenseUserNotes('@rental-week:{}'),'');
 assert.equal(runtime.rentalExpenseUserNotes(expense().notes),'Original source');
});
test('October defaults after September’s cross-month cutoff and remains editable custom dates',()=>{
 const next=runtime.nextRentalReportingWeek('2026-10',[{...meta}]);assert.equal(next.start,'2026-10-05');assert.equal(next.end,'2026-10-10');assert.equal(next.month,'2026-10');
});
test('weekly reconciliation reuses an existing financial row and reruns without duplicate writes',()=>{
 const row={date:'2026-10-02',party:'Bongo',description:'Diesel',amount:2000,week:meta};
 const report={source:{sha256:'a'.repeat(64)},weeks:[{rows:[row]}]};
 const original={...expense({notes:'Historical import; source: OCT 2026!D4:monthly-equipment;'}),expense_date:'2026-10-02'};
 const state={gmea_rental_expenses:[original],gmea_rental_equipment:[{id,name:'Bongo'}],gmea_rental_expense_categories:[{id,name:'Diesel/Fuel',is_active:true}]};
 const result=buildRentalWeeklyImportPlans(report,state,runtime);assert.equal(result.plans.length,1);assert.equal(result.plans[0].id,id);assert.equal(result.plans[0].version,2);assert.equal(result.plans[0].command.kind,'update');
 state.gmea_rental_expenses=[{...result.plans[0].command.value,expense_date:row.date}];assert.equal(buildRentalWeeklyImportPlans(report,state,runtime).plans.length,0);
 state.gmea_rental_expenses[0].amount=2200;assert.throws(()=>buildRentalWeeklyImportPlans(report,state,runtime),/was changed/);
});
test('weekly maintenance validates the whole batch and uses optimistic versions for updates',async()=>{
 const {applyRentalWeeklyImportAction}=load('actions/gmeaRentalWeeklyImport.ts');const calls=[];
 const db={from(){return{select(){return this},eq(){return this},async single(){return{data:{role:'gmea',is_active:true}}}}},async rpc(name,args){calls.push({name,args});return{data:id}}};
 const plan={id,source:'SEPTEMBER WEEKLY!G89',version:2,command:{kind:'update',value:expense()}};
 await assert.rejects(applyRentalWeeklyImportAction(db,id,[plan,{...plan,version:null}],()=>{}),/Invalid weekly/);assert.equal(calls.length,0);
 await applyRentalWeeklyImportAction(db,id,[plan],()=>{});assert.equal(calls[0].args.p_version,2);assert.equal(calls[0].args.p_expense,id);
});
test('monthly UI lists cutoff totals and weekly UI exposes itemized sections with CEO view-only controls',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const mocks={'@/components/workspace/workspace.module.css':{default:{}},'./rentalWeeklyReports.module.css':{default:{}},'./GmeaRentalExpenseForm':{default:()=>null}};
 const Reports=load('features/gmea-rentals/components/GmeaRentalWeeklyReports.tsx',mocks).default;
 const operations={expenses:[expense()],equipment:[],categories:[],workers:[]};
 const month=renderToStaticMarkup(React.createElement(Reports,{operations,canEdit:false,view:'monthly',onViewWeek:()=>{}}));
 assert.ok(month.includes('Monthly total')&&month.includes('View week')&&month.includes('₱2,000.00'));assert.ok(month.includes('Not entered'));assert.ok(!month.includes('New week'));
 const week=renderToStaticMarkup(React.createElement(Reports,{operations,canEdit:false,view:'weekly',onViewWeek:()=>{}}));
 assert.ok(week.includes('Equipment expenses')&&week.includes('Cash advances')&&week.includes('Salaries'));assert.ok(week.includes('Diesel')&&week.includes('Bongo'));assert.ok(week.includes('>Details</button>'));assert.ok(!week.includes('Add salary')&&!week.includes('>Edit</button>'));
});
test('future-week entry opens with editable reporting boundaries and actual expense date',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const Form=load('features/gmea-rentals/components/GmeaRentalExpenseForm.tsx',{
  './useGmeaRentalOperationsMutation':{useGmeaRentalOperationsMutation:()=>({pending:false,error:'',saveExpense:async()=>{}})},
  './GmeaRentalsDialog':{default:({children})=>React.createElement('section',{},children)},
 }).default;
 const html=renderToStaticMarkup(React.createElement(Form,{equipment:[],categories:[],weekContext:runtime.nextRentalReportingWeek('2026-10',[meta]),onClose:()=>{}}));
 assert.ok(html.includes('Week start')&&html.includes('value="2026-10-05"')&&html.includes('value="2026-10-10"'));assert.ok(html.includes('Week expense section'));assert.ok(html.includes('min="2026-10-05" max="2026-10-10"'));assert.ok(!html.includes('@rental-week:'));
});
