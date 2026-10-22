const assert = require("node:assert/strict");
const test = require("node:test");
const { randomUUID } = require("node:crypto");
const load = require("./helpers/loadGmeaModule.cjs");

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

function harness(actionMocks = {}) {
  const reads = deferred(), writes = deferred(), refreshes = [], messages = [], states = [], inputUpdates = [];
  let inputOptions = { methods: ["Existing method"], suppliers: ["Existing supplier"], invoiceNames: [], clients: [], locations: [], services: [] };
  let cursor = 0;
  const mocks = {
    react: {
      useRef: value => ({ current: value }),
      useState: initial => {
        const index = cursor++;
        states[index] = typeof initial === "function" ? initial() : initial;
        return [states[index], value => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
      },
    },
    swr: { useSWRConfig: () => ({ mutate: (key, updater, options) => {
      if (updater) {
        assert.equal(key, "gmea-input-options");
        assert.deepEqual(options, { revalidate: false });
        inputOptions = updater(inputOptions); inputUpdates.push(inputOptions);
        return Promise.resolve(inputOptions);
      }
      refreshes.push(key); return reads.promise;
    } }) },
    sonner: { toast: { success: message => messages.push(["success", message]), warning: message => messages.push(["warning", message]) } },
    "next/navigation": { useRouter: () => ({ push() {}, refresh() { assert.fail("A second route refresh duplicates server revalidation"); } }) },
    "@/features/gmea-forms/components/GmeaEntrySession": { useGmeaEntrySession: () => ({ addingAgain: () => true }) },
    ...actionMocks,
  };
  return { reads, writes, refreshes, messages, states, inputUpdates, mocks, hook: (file, name, ...args) => load(file, mocks)[name](...args) };
}

test("operation Save & Add Again finishes after persistence while dashboard reads remain pending", async () => {
  let calls = 0, closed = 0, saved;
  const api = harness({ "@/actions/gmeaOperationExpenses": { saveGmeaOperationExpenseAction: () => { calls++; return api.writes.promise; } } });
  const expense = { id: randomUUID(), date: "2026-10-22", category: "Water", description: "Water bill", amount: 100, payee: "Supplier", method: "Cash", reference: "", notes: "", version: 1 };
  const form = api.hook("features/gmea-operation-expenses/hooks/useOperationExpenseForm.ts", "useOperationExpenseForm", expense,
    () => { closed++; }, row => { saved = row; });
  let finished = false;
  const result = form.submit().then(() => { finished = true; });
  await form.submit();
  assert.equal(calls, 1, "Duplicate submissions cannot start another write");
  assert.equal(closed, 0, "The dialog stays open until the database confirms success");
  api.writes.resolve({ ...expense, amount: 120, version: 2 });
  await flush();
  assert.equal(finished, true);
  assert.equal(closed, 1);
  assert.equal(saved.amount, 120);
  assert.equal(saved.version, 2);
  assert.deepEqual(api.refreshes, ["gmea-dashboard:overview"]);
  assert.deepEqual(api.inputUpdates[0].methods, ["Cash", "Existing method"]);
  assert.deepEqual(api.inputUpdates[0].suppliers, ["Existing supplier", "Supplier"]);
  api.reads.reject(new Error("Dashboard unavailable"));
  await flush();
  assert.deepEqual(api.messages.map(([kind]) => kind), ["success", "warning"]);
  assert.equal(api.states[2], "", "A refresh failure must not show a save error");
  await result;
});

test("suggestions fall back to a server read when their initial cache is still empty", async () => {
  const calls = [];
  const { useGmeaCacheRefresh } = load("features/gmea-forms/hooks/useGmeaCacheRefresh.ts", {
    swr: { useSWRConfig: () => ({ mutate: async (key, updater) => {
      calls.push([key, Boolean(updater)]);
      if (updater) assert.equal(updater(undefined), undefined);
    } }) },
    sonner: { toast: { warning: () => assert.fail("Successful refresh should not warn") } },
  });
  useGmeaCacheRefresh()([], { methods: "Cash" });
  await flush();
  assert.deepEqual(calls, [["gmea-input-options", true], ["gmea-input-options", false]]);
});

test("failed operation writes retain the form, allow retry, and never close or refresh", async () => {
  let closed = 0;
  const api = harness({ "@/actions/gmeaOperationExpenses": { saveGmeaOperationExpenseAction: () => api.writes.promise } });
  const expense = { id: randomUUID(), date: "2026-10-22", category: "Water", description: "Water bill", amount: 100, payee: "", method: "", reference: "", notes: "", version: 1 };
  const form = api.hook("features/gmea-operation-expenses/hooks/useOperationExpenseForm.ts", "useOperationExpenseForm", expense, () => { closed++; });
  const result = form.submit();
  api.writes.reject(new Error("Connection lost"));
  await result;
  assert.equal(closed, 0);
  assert.equal(api.states[0].description, "Water bill");
  assert.equal(api.states[1], false);
  assert.equal(api.states[2], "Connection lost");
  assert.deepEqual(api.refreshes, []);
  assert.deepEqual(api.messages, []);
});

test("project and rental modal writes finish without waiting for view refreshes", async t => {
  const cases = [
    ["project expense", "features/gmea-projects/hooks/useGmeaMutation.ts", "useGmeaMutation", "@/actions/gmeaProjects", "saveGmeaProjectAction", [{ id: "project", version: 1 }], hook => hook({ kind: "expense", value: {} })],
    ["rental expense deletion", "features/gmea-rentals/hooks/useGmeaRentalOperationsMutation.ts", "useGmeaRentalOperationsMutation", "@/actions/gmeaRentals", "saveGmeaRentalExpenseAction", [], hook => hook.saveExpense({ id: "expense", version: 1 }, { kind: "delete" })],
    ["rental payment", "features/gmea-rentals/hooks/useGmeaRentalCollectionMutation.ts", "useGmeaRentalCollectionMutation", "@/actions/gmeaRentals", "saveGmeaRentalCollectionAction", [{ id: "rental", version: 1 }], hook => hook.save({ kind: "record_payment", value: {} })],
  ];
  for (const [name, file, hookName, actionFile, actionName, args, submit] of cases) await t.test(name, async () => {
    const api = harness({
      [actionFile]: { [actionName]: () => api.writes.promise },
      "@/actions/gmeaCustomerIncome": {},
    });
    const hook = api.hook(file, hookName, ...args);
    let finished = false;
    const result = submit(hook).then(() => { finished = true; });
    assert.equal(finished, false);
    api.writes.resolve("saved-id");
    await flush();
    assert.equal(finished, true, "Unresolved reads must not keep the modal busy");
    assert.ok(api.refreshes.length > 0);
    api.reads.resolve();
    await result;
  });
});

test("reusable input suggestions save concurrently before returning to the financial write", async () => {
  const pending = [], started = [];
  const { rememberGmeaInputOptions } = load("actions/utils/rememberGmeaInputOptions.ts", {
    "server-only": {},
    "@/features/gmea-projects/server/gmeaDatabase": { gmeaWriter: () => ({ from: () => ({ insert: option => {
      started.push(option.field);
      const request = deferred(); pending.push(request); return request.promise;
    } }) }) },
  });
  let finished = false;
  const result = rememberGmeaInputOptions({ supplier: "Supplier", method: "Cash" }).then(() => { finished = true; });
  assert.deepEqual(started, ["supplier", "method"]);
  pending[0].resolve({ error: null });
  await flush();
  assert.equal(finished, false);
  pending[1].resolve({ error: null });
  await result;
  assert.equal(finished, true);
});
