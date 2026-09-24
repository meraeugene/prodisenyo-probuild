const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const { randomUUID } = require("node:crypto");
const { PGlite } = require("@electric-sql/pglite");

const migrations = [
  "gmea-rentals-01-foundation.sql",
  "gmea-rentals-02-equipment-management.sql",
  "gmea-rentals-03-rental-workspace.sql",
  "gmea-rentals-04-collections.sql",
  "gmea-rentals-05-expenses-workers.sql",
].map((name) => fs.readFileSync("supabase/" + name, "utf8"));

test("GMEA Rentals foundation is isolated, readable, and idempotent", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());

  await db.exec(
    [
      "create role anon;create role authenticated;create role service_role bypassrls;create schema auth;",
      "create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.user_id',true),'')::uuid $$;",
      "grant usage on schema auth to authenticated,service_role;",
      "create type public.app_role as enum('gmea','ceo','engineer');",
      "create table public.profiles(id uuid primary key,role public.app_role not null,is_active boolean not null default true);",
      "grant select on public.profiles to authenticated;",
    ].join("\n"),
  );

  for (const migration of migrations) await db.exec(migration);

  const expectedTables = [
    "gmea_rental_equipment",
    "gmea_rentals",
    "gmea_rental_items",
    "gmea_rental_workers",
    "gmea_rental_worker_assignments",
    "gmea_rental_payments",
    "gmea_rental_expense_categories",
    "gmea_rental_expenses",
    "gmea_rental_expense_notifications",
  ];
  const tableRows = await db.query(
    "select tablename from pg_tables where schemaname='public' and tablename like 'gmea_rental%'",
  );
  assert.deepEqual(
    tableRows.rows.map((row) => row.tablename).sort(),
    [...expectedTables].sort(),
  );

  const gmea = randomUUID();
  const ceo = randomUUID();
  const engineer = randomUUID();
  const inactive = randomUUID();
  for (const [id, role, isActive] of [
    [gmea, "gmea", true],
    [ceo, "ceo", true],
    [engineer, "engineer", true],
    [inactive, "gmea", false],
  ]) {
    await db.query("insert into public.profiles values($1,$2,$3)", [
      id,
      role,
      isActive,
    ]);
  }

  const category = randomUUID();
  const equipment = randomUUID();
  const rental = randomUUID();
  const worker = randomUUID();
  const expense = randomUUID();
  await db.query(
    "insert into public.gmea_rental_expense_categories(id,name) values($1,'Fuel')",
    [category],
  );
  await db.query(
    "insert into public.gmea_rental_equipment(id,code,name) values($1,'EQ-001','Mini Excavator')",
    [equipment],
  );
  await db.query(
    "insert into public.gmea_rentals(id,rental_number,customer_name,start_date,created_by,updated_by) values($1,'R-001','Test Customer','2026-09-01',$2,$2)",
    [rental, gmea],
  );
  await db.query(
    "insert into public.gmea_rental_items(rental_id,equipment_id,equipment_name,quantity,rate) values($1,$2,'Mini Excavator',1,5000)",
    [rental, equipment],
  );
  await db.query(
    "insert into public.gmea_rental_workers(id,worker_code,full_name) values($1,'W-001','Test Operator')",
    [worker],
  );
  await db.query(
    "insert into public.gmea_rental_worker_assignments(rental_id,worker_id,assigned_from) values($1,$2,'2026-09-01')",
    [rental, worker],
  );
  await db.query(
    "insert into public.gmea_rental_payments(rental_id,amount,payment_date,recorded_by) values($1,5000,'2026-09-01',$2)",
    [rental, gmea],
  );
  await db.query(
    "insert into public.gmea_rental_expenses(id,rental_id,equipment_id,category_id,expense_date,description,amount,created_by,updated_by) values($1,$2,$3,$4,'2026-09-01','Diesel',1000,$5,$5)",
    [expense, rental, equipment, category, gmea],
  );
  await db.query(
    "insert into public.gmea_rental_expense_notifications(expense_id,rental_id,recipient_id) values($1,$2,$3)",
    [expense, rental, ceo],
  );

  async function asUser(userId, callback) {
    await db.query("select set_config('test.user_id',$1,false)", [userId]);
    await db.exec("set role authenticated");
    try {
      return await callback();
    } finally {
      await db.exec("reset role");
    }
  }

  for (const userId of [gmea, ceo]) {
    await asUser(userId, async () => {
      const result = await db.query("select id from public.gmea_rentals");
      assert.equal(result.rows.length, 1);
    });
  }
  for (const userId of [engineer, inactive]) {
    await asUser(userId, async () => {
      const result = await db.query("select id from public.gmea_rentals");
      assert.equal(result.rows.length, 0);
    });
  }

  await asUser(ceo, async () => {
    const result = await db.query(
      "select id from public.gmea_rental_expense_notifications",
    );
    assert.equal(result.rows.length, 1);
  });
  await asUser(gmea, async () => {
    const result = await db.query(
      "select id from public.gmea_rental_expense_notifications",
    );
    assert.equal(result.rows.length, 0);
    await assert.rejects(
      db.exec("delete from public.gmea_rental_expenses"),
      /permission denied/,
    );
  });

  const command = (number, start, end) => ({
    kind: "create",
    value: {
      rental_number: number,
      client: "Test Client",
      location: "CDO",
      start_date: start,
      end_date: end,
      notes: "",
      status: "active",
      items: [
        {
          id: randomUUID(),
          equipment_id: equipment,
          rate_type: "fixed",
          unit_rate: 2500,
          quantity: 9,
        },
      ],
    },
  });
  const created = await db.query(
    "select public.mutate_gmea_rental($1,null,null,$2::jsonb) id",
    [gmea, JSON.stringify(command("R-002", "2026-09-02", "2026-09-03"))],
  );
  const fixedItem = await db.query(
    "select quantity,rate from public.gmea_rental_items where rental_id=$1",
    [created.rows[0].id],
  );
  assert.equal(Number(fixedItem.rows[0].quantity), 1);
  assert.equal(Number(fixedItem.rows[0].rate), 2500);
  await assert.rejects(
    db.query("select public.mutate_gmea_rental($1,null,null,$2::jsonb)", [
      gmea,
      JSON.stringify(command("R-003", "2026-09-03", "2026-09-04")),
    ]),
    /already assigned/,
  );

  const createdRental = created.rows[0].id;
  const paymentId = randomUUID();
  const recordPayment = {
    kind: "record_payment",
    value: {
      id: paymentId,
      amount: 1000,
      payment_date: "2026-09-01",
      method: "Bank",
      reference_number: "REF-1",
      notes: "Deposit",
    },
  };
  await db.query(
    "select public.mutate_gmea_rental_collection($1,$2,1,$3::jsonb)",
    [gmea, createdRental, JSON.stringify(recordPayment)],
  );
  const afterPayment = await db.query(
    "select version from public.gmea_rentals where id=$1",
    [createdRental],
  );
  assert.equal(afterPayment.rows[0].version, 2);
  await assert.rejects(
    db.query("select public.mutate_gmea_rental_collection($1,$2,2,$3::jsonb)", [
      gmea,
      createdRental,
      JSON.stringify({
        ...recordPayment,
        value: { ...recordPayment.value, id: randomUUID(), amount: 1501 },
      }),
    ]),
    /exceeds the remaining rental balance/,
  );
  await assert.rejects(
    db.query("select public.mutate_gmea_rental_collection($1,$2,2,$3::jsonb)", [
      gmea,
      createdRental,
      JSON.stringify({
        ...recordPayment,
        value: { ...recordPayment.value, id: randomUUID(), amount: -1 },
      }),
    ]),
    /greater than zero/,
  );
  await assert.rejects(
    db.query("select public.mutate_gmea_rental_collection($1,$2,1,$3::jsonb)", [
      gmea,
      createdRental,
      JSON.stringify({
        ...recordPayment,
        value: { ...recordPayment.value, id: randomUUID(), amount: 1 },
      }),
    ]),
    /changed.*Reload/,
  );
  await assert.rejects(
    db.query("select public.mutate_gmea_rental_collection($1,$2,2,$3::jsonb)", [
      ceo,
      createdRental,
      JSON.stringify({
        ...recordPayment,
        value: { ...recordPayment.value, id: randomUUID(), amount: 1 },
      }),
    ]),
    /Only active GMEA users/,
  );
  await assert.rejects(
    db.query("select public.mutate_gmea_rental_collection($1,$2,2,$3::jsonb)", [
      gmea,
      createdRental,
      JSON.stringify({
        kind: "void_payment",
        payment_id: paymentId,
        reason: "",
      }),
    ]),
    /Void reason is required/,
  );
  const voidPayment = {
    kind: "void_payment",
    payment_id: paymentId,
    reason: "Duplicate entry",
  };
  await db.query(
    "select public.mutate_gmea_rental_collection($1,$2,2,$3::jsonb)",
    [gmea, createdRental, JSON.stringify(voidPayment)],
  );
  const audit = await db.query(
    "select status,void_reason,voided_by from public.gmea_rental_payments where id=$1",
    [paymentId],
  );
  assert.equal(audit.rows[0].status, "voided");
  assert.equal(audit.rows[0].void_reason, "Duplicate entry");
  assert.equal(audit.rows[0].voided_by, gmea);
  const postedTotal = await db.query(
    "select coalesce(sum(amount),0) total from public.gmea_rental_payments where rental_id=$1 and status='posted'",
    [createdRental],
  );
  assert.equal(Number(postedTotal.rows[0].total), 0);

  const workerCommand = {
    kind: "create",
    value: {
      name: "Juan Driver",
      role: "Driver",
      phone: "09170000000",
      is_active: true,
    },
  };
  const workerResult = await db.query(
    "select public.mutate_gmea_rental_worker($1,null,null,$2::jsonb) id",
    [gmea, JSON.stringify(workerCommand)],
  );
  const createdWorker = workerResult.rows[0].id;
  const workerRow = await db.query(
    "select full_name,role_name,contact_number,status from public.gmea_rental_workers where id=$1",
    [createdWorker],
  );
  assert.deepEqual(workerRow.rows[0], {
    full_name: "Juan Driver",
    role_name: "Driver",
    contact_number: "09170000000",
    status: "active",
  });
  await assert.rejects(
    db.query(
      "select public.mutate_gmea_rental_worker($1,null,null,$2::jsonb)",
      [
        ceo,
        JSON.stringify({
          ...workerCommand,
          value: { ...workerCommand.value, name: "Blocked" },
        }),
      ],
    ),
    /Only active GMEA users/,
  );

  const assignmentCommand = {
    kind: "assign_worker",
    value: {
      id: randomUUID(),
      worker_id: createdWorker,
      equipment_id: equipment,
    },
  };
  await db.query(
    "select public.mutate_gmea_rental_assignment($1,$2,3,$3::jsonb)",
    [gmea, createdRental, JSON.stringify(assignmentCommand)],
  );
  const assignment = await db.query(
    "select worker_id,equipment_id,status from public.gmea_rental_worker_assignments where rental_id=$1 and worker_id=$2",
    [createdRental, createdWorker],
  );
  assert.equal(assignment.rows[0].equipment_id, equipment);
  assert.equal(assignment.rows[0].status, "assigned");
  const categoryCount = await db.query(
    "select count(*) count from public.gmea_rental_expense_categories where name in ('Diesel/Fuel','Gasoline','Maintenance','Repair','Parts','Registration/Renewal','Driver','Operator','Labor','Cash Advance','Miscellaneous')",
  );
  assert.equal(Number(categoryCount.rows[0].count), 11);

  const expenseCommand = (
    id,
    rentalId,
    equipmentId,
    vatMode = "inclusive",
  ) => ({
    kind: "create",
    value: {
      id,
      rental_id: rentalId,
      equipment_id: equipmentId,
      category_id: category,
      date: "2026-09-01",
      description: "Fuel expense",
      supplier: "Fuel Station",
      method: "Cash",
      invoice_number: "OR-100",
      amount: 1120,
      refunded_amount: 100,
      vat_mode: vatMode,
      vat_rate: vatMode === "off" ? 0 : 12,
      notes: "",
      version: 1,
    },
  });
  const linkedExpense = randomUUID();
  await db.query(
    "select public.mutate_gmea_rental_expense($1,null,null,$2::jsonb)",
    [
      gmea,
      JSON.stringify(expenseCommand(linkedExpense, createdRental, equipment)),
    ],
  );
  const equipmentExpense = randomUUID();
  const generalExpense = randomUUID();
  await db.query(
    "select public.mutate_gmea_rental_expense($1,null,null,$2::jsonb)",
    [
      gmea,
      JSON.stringify(expenseCommand(equipmentExpense, null, equipment, "off")),
    ],
  );
  await db.query(
    "select public.mutate_gmea_rental_expense($1,null,null,$2::jsonb)",
    [
      gmea,
      JSON.stringify(expenseCommand(generalExpense, null, null, "exclusive")),
    ],
  );
  const expenseScopes = await db.query(
    "select id,rental_id,equipment_id,vat_mode,vat_rate,refunded_amount from public.gmea_rental_expenses where id in ($1,$2,$3) order by id",
    [linkedExpense, equipmentExpense, generalExpense],
  );
  assert.equal(expenseScopes.rows.length, 3);
  assert.ok(
    expenseScopes.rows.some(
      (row) =>
        row.rental_id === createdRental && row.equipment_id === equipment,
    ),
  );
  assert.ok(
    expenseScopes.rows.some(
      (row) => row.rental_id === null && row.equipment_id === equipment,
    ),
  );
  assert.ok(
    expenseScopes.rows.some(
      (row) => row.rental_id === null && row.equipment_id === null,
    ),
  );
  await assert.rejects(
    db.query(
      "select public.mutate_gmea_rental_expense($1,null,null,$2::jsonb)",
      [ceo, JSON.stringify(expenseCommand(randomUUID(), null, null))],
    ),
    /Only active GMEA users/,
  );
  await assert.rejects(
    db.query(
      "select public.mutate_gmea_rental_expense($1,null,null,$2::jsonb)",
      [
        gmea,
        JSON.stringify({
          ...expenseCommand(randomUUID(), null, null),
          value: {
            ...expenseCommand(randomUUID(), null, null).value,
            vat_mode: "inclusive",
            vat_rate: 5,
          },
        }),
      ],
    ),
    /Invalid VAT treatment/,
  );
  const notificationCount = await db.query(
    "select count(*) count from public.gmea_rental_expense_notifications where expense_id=$1 and recipient_id=$2",
    [linkedExpense, ceo],
  );
  assert.equal(Number(notificationCount.rows[0].count), 1);

  for (const migration of migrations) await db.exec(migration);
  const preserved = await db.query(
    "select count(*) count from public.gmea_rentals",
  );
  assert.equal(Number(preserved.rows[0].count), 2);
});
