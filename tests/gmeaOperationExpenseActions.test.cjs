const assert = require('node:assert/strict'), test = require('node:test'), { randomUUID } = require('node:crypto');
const load = require('./helpers/loadGmeaModule.cjs');

function harness() {
  const rows = new Map(), actor = randomUUID(); let allowed = true;
  const writer = { from() {
    let mode = 'read', value, conditions = [];
    const query = {
      insert(input) { mode = 'insert'; value = input; return query; },
      update(input) { mode = 'update'; value = input; return query; },
      delete() { mode = 'delete'; return query; },
      select() { return query; }, eq(key, value) { conditions.push([key, value]); return query; },
      async single() { return query.maybeSingle(); },
      async maybeSingle() {
        if (mode === 'insert') {
          if (rows.has(value.id)) return { data: null, error: { code: '23505', message: 'Duplicate expense id' } };
          const row = { ...value, version: 1, created_at: '2026-04-01T00:00:00Z', updated_at: '2026-04-01T00:00:00Z' };
          rows.set(row.id, row); return { data: { ...row }, error: null };
        }
        const row = [...rows.values()].find(row => conditions.every(([key, value]) => row[key] === value));
        if (!row) return { data: null, error: null };
        if (mode === 'delete') { rows.delete(row.id); return { data: { id: row.id }, error: null }; }
        if (mode === 'update') rows.set(row.id, { ...row, ...value });
        return { data: { ...rows.get(row.id) }, error: null };
      },
    }; return query;
  } };
  const action = load('actions/gmeaOperationExpenses.ts', {
    'next/cache': { revalidatePath() {} },
    '@/lib/auth': { APP_ROLES: { GMEA: 'gmea' }, requireRole: async role => { assert.equal(role, 'gmea'); if (!allowed) throw new Error('Access denied'); return { user: { id: actor } }; } },
    '@/features/gmea-operation-expenses/server/operationExpensesQueries': { getGmeaOperationExpenses: async () => [...rows.values()] },
    '@/features/gmea-operation-expenses/server/operationExpensesDatabase': { operationExpensesWriter: () => writer },
    './utils/rememberGmeaInputOptions': { rememberGmeaInputOptions: async () => {} },
  });
  return { ...action, rows, actor, deny: () => { allowed = false; } };
}
const value = () => ({ id: randomUUID(), date: '2026-04-01', category: 'Transportation', description: 'Office travel', amount: 5800, payee: 'Driver', method: 'Cash', reference: '', notes: '' });

test('operation expense saves persist, return the saved row, and retry the same id without adding it twice', async () => {
  const api = harness(), input = value();
  const first = await api.saveGmeaOperationExpenseAction(null, input);
  assert.equal(first.date, '2026-04-01'); assert.equal(first.amount, 5800); assert.equal(first.alreadyAdded, false);
  assert.equal(first.created_by, api.actor); assert.equal(first.version, 1);
  const retry = await api.saveGmeaOperationExpenseAction(null, input);
  assert.equal(retry.alreadyAdded, true); assert.equal(api.rows.size, 1);
  assert.deepEqual((await api.getGmeaOperationExpensesAction()).map(row => row.id), [input.id]);
  await assert.rejects(() => api.saveGmeaOperationExpenseAction(null, { ...input, amount: 999 }), /Duplicate/);
  assert.equal(api.rows.get(input.id).amount, 5800);
});

test('operation edits check the version and invalid or unauthorized saves cannot change records', async () => {
  const api = harness(), input = value();
  await api.saveGmeaOperationExpenseAction(null, input);
  const edited = await api.saveGmeaOperationExpenseAction(1, { ...input, amount: 6000 });
  assert.equal(edited.version, 2); assert.equal(edited.amount, 6000);
  await assert.rejects(() => api.saveGmeaOperationExpenseAction(1, input), /changed/);
  await assert.rejects(() => api.saveGmeaOperationExpenseAction(null, { ...value(), amount: 0 }));
  api.deny();
  await assert.rejects(() => api.saveGmeaOperationExpenseAction(null, value()), /Access denied/);
  assert.equal(api.rows.size, 1); assert.equal(api.rows.get(input.id).amount, 6000);
});

test('operation deletion requires GMEA access, the current version, and a valid id', async () => {
  const api = harness(), input = value();
  await api.saveGmeaOperationExpenseAction(null, input);
  await assert.rejects(() => api.deleteGmeaOperationExpenseAction(input.id, 2), /changed/);
  assert.equal(api.rows.size, 1);
  await assert.rejects(() => api.deleteGmeaOperationExpenseAction('invalid', 1));
  await api.deleteGmeaOperationExpenseAction(input.id, 1);
  assert.equal(api.rows.size, 0);
  await assert.rejects(() => api.deleteGmeaOperationExpenseAction(input.id, 1), /deleted/);
  api.deny(); await assert.rejects(() => api.deleteGmeaOperationExpenseAction(input.id, 1), /Access denied/);
});
