const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const {randomUUID} = require("node:crypto");
const {PGlite} = require("@electric-sql/pglite");
const load = require("./helpers/loadGmeaModule.cjs");
const {parseCustomerIncomeWorkbook,parseIncomeDate} = load("features/gmea-rentals/utils/parseCustomerIncomeWorkbook.ts");
const {mapHistoricalIncomeRecords} = load("features/gmea-rentals/utils/historicalIncomeMappers.ts");
const {selectRentalIncomeTransactions,summarizeRentalIncome,rentalOutstandingAtMonthEnd} = load("features/gmea-rentals/utils/rentalIncomeSelectors.ts");
const starts = [5,9,13,15,17,19,23,25,27,29,31,35,37,41,45,49,52,54,56,58,62,66,70,72,75,77,79,81,83,88,90,94,95,96,98,99,100,101,102,103,104];
function snapshot() {
  const cells={E2:{v:"PAY  DATE"},F2:{v:"COMPANY NAME"},H93:{v:"50%DOWN PAYMENT"},J93:{v:"FULL PAYMENT"}};
  for(const row of starts) cells[`F${row}`]={v:"Client"};
  for(const [cell,v] of Object.entries({E5:"Downpayment",H5:1000,E6:"July 31,2025",E7:"Fullypaid",H7:1000,E8:"Aug 01,2025",J5:2000,
    E75:"Bill SUB",H75:2000,E76:"Aug 29,2025",J75:2000,
    E98:"Jan 14,2026",H98:9000,J98:18000,K98:18000,
    E100:"March 02,2026",J100:14400,K100:44800,E101:"March 04,2026",J101:16000,E102:"March 06,2026",J102:14400,
    E103:"May 05,2026",H103:25000,I103:"May 09,2026",J103:25000,K103:50000,
    E104:"May 07,2026",H104:21000,I104:"May 12,2026",J104:15600,K104:36600}))cells[cell]={v};
  return {"CUSTOMER TRANSACTION":cells,Sheet1:{}};
}
const batch=()=>parseCustomerIncomeWorkbook(snapshot(),"a".repeat(64),"test.xlsx");

test("source parser keeps separate receipt months, holds bill submissions/conflicts and avoids copying aggregate totals",()=>{
  const parsed=batch();const rows=mapHistoricalIncomeRecords(parsed.records,"2026-10-10T00:00:00Z","actor");
  const income=month=>summarizeRentalIncome(selectRentalIncomeTransactions(rows,month));
  assert.equal(income("2025-07").downPayment,1000);
  assert.equal(income("2025-08").fullPayment,1000);
  assert.equal(income("2026-01").collected,0);
  assert.equal(income("2026-03").collected,44800);
  assert.equal(income("2026-05").collected,86600);
  assert.equal(income("2026-05").downPayment,46000);
  assert.equal(income("2026-05").fullPayment,40600);
  assert.equal(rentalOutstandingAtMonthEnd(rows.find(row=>row.id.endsWith("103")),"2026-05"),0);
  assert.equal(rentalOutstandingAtMonthEnd(rows.find(row=>row.id.endsWith("98")),"2026-01"),0);
  assert.equal(parsed.records.find(row=>row.id.endsWith("100")).charge,null);
  assert.equal(parsed.records.find(row=>row.id.endsWith("75")).receipts[0].confirmed,false);
  assert.equal(parsed.records.find(row=>row.id.endsWith("98")).sourceRows[0].J,18000);
  assert.deepEqual(batch(),batch());
  const changed=snapshot();changed["CUSTOMER TRANSACTION"].H105={v:10};
  assert.throws(()=>parseCustomerIncomeWorkbook(changed,"a".repeat(64),"test.xlsx"),/Unmapped/);
  assert.equal(parseIncomeDate("February 30,2026"),null);
  assert.equal(parseIncomeDate("Jan 06 - 12,2026"),null);
});

test("customer archive is atomic, idempotent, role protected, and rejects changed source",async t=>{
  const db=new PGlite();t.after(()=>db.close());
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.user_id',true),'')::uuid $$;
    grant usage on schema auth to authenticated; create table profiles(id uuid primary key,role text,is_active boolean);
    grant select on profiles to authenticated;
    create function can_read_gmea_rentals() returns boolean language sql stable as $$ select exists(select 1 from profiles where id=auth.uid() and role in ('gmea','ceo') and is_active) $$;`);
  const migration=fs.readFileSync("supabase/gmea-rentals-09-customer-income-import.sql","utf8");
  await db.exec(migration);await db.exec(migration);
  const actor=randomUUID(),ceo=randomUUID(),engineer=randomUUID(),inactive=randomUUID();
  for(const [id,role,active] of [[actor,"gmea",true],[ceo,"ceo",true],[engineer,"engineer",true],[inactive,"gmea",false]])
    await db.query("insert into profiles values($1,$2,$3)",[id,role,active]);
  const parsed=batch();
  const write=(id,payload)=>db.query("select import_gmea_customer_income($1,$2::jsonb)",[id,JSON.stringify(payload)]);
  await assert.rejects(write(inactive,parsed),/active GMEA/);
  await assert.rejects(write(ceo,parsed),/active GMEA/);
  await write(actor,parsed);await write(actor,parsed);
  assert.equal((await db.query("select count(*)::int as n from gmea_rental_income_imports")).rows[0].n,1);
  const changed=structuredClone(parsed);changed.records[0].client="Changed";
  await assert.rejects(write(actor,changed),/changed/);
  const invalid=structuredClone(parsed);invalid.source_name="another.xlsx";invalid.source_hash="b".repeat(64);
  invalid.records[0].receipts[0].date=null;
  await assert.rejects(write(actor,invalid),/exact payment date/);
  assert.equal((await db.query("select count(*)::int as n from gmea_rental_income_imports")).rows[0].n,1);
  await db.exec("set role authenticated");
  for(const [id,count] of [[actor,1],[ceo,1],[engineer,0],[inactive,0]]) {
    await db.query("select set_config('test.user_id',$1,false)",[id]);
    assert.equal((await db.query("select count(*)::int as n from gmea_rental_income_imports")).rows[0].n,count);
  }
  await assert.rejects(write(actor,parsed),/permission denied/);
  await assert.rejects(db.query("delete from gmea_rental_income_imports"),/permission denied/);
});
