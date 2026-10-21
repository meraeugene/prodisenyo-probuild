const assert = require('node:assert/strict'), test = require('node:test'), { randomUUID } = require('node:crypto');
const { PGlite } = require('@electric-sql/pglite');
const load = require('./helpers/loadGmeaModule.cjs');
const { mapHistoricalIncomeRecords } = load('features/gmea-rentals/utils/historicalIncomeMappers.ts');

test('rental income edits/deletes preserve receipts and source evidence, enforce versions, and reject concurrent import changes', async () => {
  const db = new PGlite(), actor = randomUUID(), customerId = randomUUID(), hash = 'a'.repeat(64);
  let allowed = true, beforeMutation;
  await db.exec(`create table gmea_rental_customer_income(id uuid primary key,client text,location text,service text,total_amount numeric,payments jsonb,version int,updated_at timestamptz);
    create table gmea_rental_income_imports(source_hash text primary key,records jsonb,source_snapshot jsonb,imported_at timestamptz);`);
  function from(table) {
    assert.ok(['gmea_rental_customer_income', 'gmea_rental_income_imports', 'gmea_rentals'].includes(table));
    let mode = 'read', values; const conditions = [], parameters = [];
    const parameter = value => { parameters.push(value); return `$${parameters.length}`; };
    const query = {
      select() { return query; }, update(value) { mode = 'update'; values = value; return query; }, delete() { mode = 'delete'; return query; },
      contains(column, value) { assert.equal(column, 'records'); assert.equal(typeof value, 'string'); conditions.push(`records @> ${parameter(value)}::jsonb`); return query; },
      eq(column, value) {
        if (column === 'records->0->>importRevision') conditions.push(`records->0->>'importRevision'=${parameter(value)}`);
        else { assert.ok(['id', 'version', 'source_hash'].includes(column)); conditions.push(`${column}=${parameter(value)}`); }
        return query;
      },
      is(column, value) { assert.equal(column, 'records->0->>importRevision'); assert.equal(value, null); conditions.push(`records->0->>'importRevision' is null`); return query; },
      async maybeSingle() {
        if (mode !== 'read' && beforeMutation) { const fn = beforeMutation; beforeMutation = undefined; await fn(); }
        const where = conditions.length ? ' where ' + conditions.join(' and ') : '';
        let sql = `select * from ${table}${where}`;
        if (mode === 'delete') sql = `delete from ${table}${where} returning *`;
        if (mode === 'update') {
          const set = Object.entries(values).map(([key, value]) => {
            assert.ok(['records', 'client', 'location', 'service', 'total_amount', 'version', 'updated_at'].includes(key));
            return `${key}=${parameter(key === 'records' ? JSON.stringify(value) : value)}${key === 'records' ? '::jsonb' : ''}`;
          }).join(',');
          sql = `update ${table} set ${set}${where} returning *`;
        }
        const result = await db.query(sql, parameters); return { data: result.rows[0] || null, error: null };
      },
    }; return query;
  }
  const api = load('actions/gmeaRentalRecords.ts', {
    'next/cache': { revalidatePath() {} },
    '@/features/gmea-rentals/server/gmeaRentalsQueries': { requireGmeaRentalsAccess: async writing => { assert.equal(writing, true); if (!allowed) throw new Error('Access denied'); return { user: { id: actor } }; } },
    '@/features/gmea-rentals/server/gmeaRentalsDatabase': { gmeaRentalsWriter: () => ({ from }) },
    './gmeaRentalDeletion': { deleteGmeaRentalRecordAction: async () => {} },
  });
  try {
    const payments = [{ id: 'paid', amount: 100, status: 'posted', payment_date: '2026-01-01' }];
    await db.query('insert into gmea_rental_customer_income values($1,$2,$3,$4,500,$5,1,now())', [customerId, 'Client', 'Manila', 'Truck', JSON.stringify(payments)]);
    const customer = { id: customerId, origin: 'customer', version: 1, client: 'Updated client', location: 'Cebu', service: 'Backhoe', charge: 600 };
    await api.editGmeaRentalIncomeRecordAction(customer);
    const saved = (await db.query('select * from gmea_rental_customer_income')).rows[0];
    assert.equal(saved.client, 'Updated client'); assert.equal(saved.version, 2); assert.deepEqual(saved.payments, payments);
    await assert.rejects(() => api.editGmeaRentalIncomeRecordAction(customer), /changed/);
    await assert.rejects(() => api.editGmeaRentalIncomeRecordAction({ ...customer, version: 2, charge: 50 }), /less than received/);
    await assert.rejects(() => api.deleteGmeaRentalIncomeRecordAction(customer), /changed/);
    await api.deleteGmeaRentalIncomeRecordAction({ ...customer, version: 2 });
    assert.equal((await db.query('select count(*)::int as count from gmea_rental_customer_income')).rows[0].count, 0);

    const original = { id: 'excel-row', client: 'Excel client', location: 'Site', service: 'Truck', source: 'Sheet!A2', charge: 500,
      receipts: [{ id: 'receipt', amount: 100, date: '2026-01-01', type: 'down_payment', method: 'Cash', source: 'Sheet!C2', confirmed: true }], issues: [], sourceRows: [{ A2: 'Original client' }] };
    const sibling = { ...original, id: 'excel-other' };
    const snapshot = { originalWorkbook: 'unchanged' };
    await db.query("insert into gmea_rental_income_imports values($1,$2,$3,'2026-01-01T00:00:00Z')", [hash, JSON.stringify([original, sibling]), JSON.stringify(snapshot)]);
    const input = { id: original.id, origin: 'historical', version: 1, client: 'Corrected client', location: 'Site', service: 'Truck', charge: 700 };
    await api.editGmeaRentalIncomeRecordAction(input);
    let imported = (await db.query('select * from gmea_rental_income_imports')).rows[0];
    assert.equal(imported.records[0].revision, 2); assert.equal(imported.records[0].updatedBy, actor);
    assert.deepEqual(imported.records[0].receipts, original.receipts); assert.deepEqual(imported.records[0].sourceRows, original.sourceRows);
    assert.deepEqual(imported.source_snapshot, snapshot); assert.equal(imported.imported_at.toISOString(), '2026-01-01T00:00:00.000Z');
    assert.deepEqual(imported.records[1], sibling);
    beforeMutation = () => db.query("update gmea_rental_income_imports set records=jsonb_set(records,'{0,importRevision}',to_jsonb('concurrent-change'::text))");
    await assert.rejects(() => api.editGmeaRentalIncomeRecordAction({ ...input, version: 2, client: 'Must not overwrite' }), /import changed/);
    imported = (await db.query('select * from gmea_rental_income_imports')).rows[0];
    assert.equal(imported.records[0].client, 'Corrected client');
    await api.deleteGmeaRentalIncomeRecordAction({ ...input, version: 2 });
    imported = (await db.query('select * from gmea_rental_income_imports')).rows[0];
    assert.equal(imported.records[0].deleted, true); assert.deepEqual(imported.records[0].receipts, original.receipts);
    assert.deepEqual(mapHistoricalIncomeRecords(imported.records, '2026-01-01', actor).map(row => row.id), [sibling.id]);
    await assert.rejects(() => api.editGmeaRentalIncomeRecordAction({ ...input, version: 3 }), /deleted/);
    allowed = false;
    await assert.rejects(() => api.deleteGmeaRentalIncomeRecordAction({ ...input, id: sibling.id }), /Access denied/);
  } finally { await db.close(); }
});
