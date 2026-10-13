const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const { randomUUID } = require("node:crypto");
const { PGlite } = require("@electric-sql/pglite");
const load = require("./helpers/loadGmeaModule.cjs");
const { normalizeCustomerIncomeInput } = load("features/gmea-rentals/utils/customerIncomeValidation.ts");
const { mapCustomerIncomeEntry } = load("features/gmea-rentals/utils/customerIncomeMappers.ts");
const { summarizeRentalPortfolio, buildRentalLocations } = load("features/gmea-rentals/utils/rentalPortfolioSelectors.ts");
const input = (extra = {}) => ({ id: randomUUID(), version: null, client: "Customer", location: "Bayanga", service: "Backhoe rental",
  total_amount: 1000, down_payment: 250, down_payment_date: "2026-05-01", full_payment: 0, full_payment_date: "", method: "Cash", ...extra });

test("customer form validates real receipt dates, payment types and charge limits", () => {
  assert.equal(normalizeCustomerIncomeInput(input()).down_payment, 250);
  for (const extra of [{ total_amount: 0 }, { down_payment: 1001 }, { down_payment: 0 }, { client: " " },
    { down_payment_date: "2026-02-30" }, { down_payment_date: "2099-01-01" }, { method: "" }, { version: -1 }])
    assert.throws(() => normalizeCustomerIncomeInput(input(extra)));
});

test("customer entry and linked expenses appear in the same portfolio location", () => {
  const entry = input();
  const row = mapCustomerIncomeEntry({ ...entry, created_at: "2026-05-01", created_by: "hr", version: 1,
    payments: [{ id: "receipt", amount: 250, payment_type: "down_payment", payment_date: "2026-05-01", status: "posted" }] });
  const expense = { income_record_id: row.id, rental_id: null, amount: 50, refunded_amount: 0, vat_mode: "off", vat_rate: 0 };
  assert.equal(row.customerIncome.version, 1);
  const summary = summarizeRentalPortfolio([row], [expense]);
  assert.equal(summary.outstanding, 750);
  assert.equal(buildRentalLocations([row], [expense])[0].summary.expenses, 50);
});

test("customer income SQL is atomic, role restricted, versioned and prevents double counting", async t => {
  const db = new PGlite(); t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.user_id',true),'')::uuid $$;
    grant usage on schema auth to authenticated,service_role;
    create type public.app_role as enum('gmea','ceo','engineer');
    create table public.profiles(id uuid primary key,role public.app_role not null,is_active boolean not null default true);
    grant select on public.profiles to authenticated;`);
  for (const name of ["01-foundation", "02-equipment-management", "03-rental-workspace", "04-collections", "05-expenses-workers", "06-ceo-expense-unread", "08-income-payment-types", "09-customer-income-import", "10-customer-entry"])
    await db.exec(fs.readFileSync(`supabase/gmea-rentals-${name}.sql`, "utf8"));
  await db.exec(fs.readFileSync("supabase/gmea-rentals-10-customer-entry.sql", "utf8"));
  const gmea = randomUUID(), ceo = randomUUID(), engineer = randomUUID();
  for (const [id, role] of [[gmea, "gmea"], [ceo, "ceo"], [engineer, "engineer"]]) await db.query("insert into profiles(id,role) values($1,$2)", [id, role]);
  const value = input();
  const save = (actor, command) => db.query("select save_gmea_customer_income($1,$2)", [actor, command]);
  await save(gmea, value);
  await assert.rejects(save(gmea, value), /changed/);
  await assert.rejects(save(ceo, input()), /Only active GMEA/);
  await save(gmea, { ...value, version: 1, down_payment: 0, full_payment: 750, full_payment_date: "2026-05-09" });
  await assert.rejects(save(gmea, { ...value, version: 1 }), /changed/);
  await assert.rejects(save(gmea, { ...value, version: 2, down_payment: 1 }), /exceed/);
  const entry = (await db.query("select * from gmea_rental_customer_income where id=$1", [value.id])).rows[0];
  assert.equal(entry.payments.length, 2);
  assert.equal(entry.version, 2);
  assert.equal(entry.payments.reduce((sum, row) => sum + row.amount, 0), 1000);
  assert.equal((await db.query("select count(*)::int count from gmea_rentals")).rows[0].count, 0);
  const category = (await db.query("select id from gmea_rental_expense_categories limit 1")).rows[0].id;
  const expense = { kind: "create", value: { id: randomUUID(), rental_id: null, equipment_id: null, category_id: category,
    date: "2026-05-10", description: "Rental fuel", supplier: "", method: "Cash", invoice_number: "", amount: 50,
    refunded_amount: 0, vat_mode: "off", vat_rate: 0, notes: "" } };
  await db.query("select create_gmea_customer_expense($1,$2,$3)", [gmea, value.id, expense]);
  assert.equal((await db.query("select income_record_id from gmea_rental_expenses where id=$1", [expense.value.id])).rows[0].income_record_id, value.id);
  await assert.rejects(db.query("select create_gmea_customer_expense($1,$2,$3)", [gmea, "missing", { ...expense, value: { ...expense.value, id: randomUUID() } }]), /existing customer/);
  await db.exec(fs.readFileSync("supabase/gmea-operation-expenses.sql", "utf8"));
  await db.exec(fs.readFileSync("supabase/gmea-operation-expenses.sql", "utf8"));
  await db.query("insert into gmea_operation_expenses(id,date,category,description,amount,created_by,updated_by) values($1,'2026-05-10','Salary','Staff salary',500,$2,$2)", [randomUUID(), gmea]);
  await db.exec("set role authenticated");
  for (const [id, count] of [[ceo, 1], [engineer, 0]]) {
    await db.query("select set_config('test.user_id',$1,false)", [id]);
    assert.equal((await db.query("select count(*)::int count from gmea_operation_expenses")).rows[0].count, count);
    assert.equal((await db.query("select count(*)::int count from gmea_rental_customer_income")).rows[0].count, count);
  }
  await db.query("select set_config('test.user_id',$1,false)", [gmea]);
  await assert.rejects(db.query("insert into gmea_operation_expenses(id,date,category,description,amount,created_by,updated_by) values($1,'2026-05-10','Salary','Direct write',1,$2,$2)", [randomUUID(), gmea]), /permission denied/);
});
