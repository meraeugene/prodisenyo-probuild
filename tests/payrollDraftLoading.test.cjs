const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

// Run the hook's state and effects deterministically around deferred requests.
function hookRunner(file, exportName, mocks = {}) {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const same = (left, right) => left && right && left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === "function" ? initial() : initial };
      return [slots[index].value, (next) => { slots[index].value = typeof next === "function" ? next(slots[index].value) : next; }];
    },
    useRef(value) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { current: value };
      return slots[index];
    },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!slots[index] || !same(slots[index].deps, deps)) slots[index] = { callback, deps };
      return slots[index].callback;
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || !same(slots[index].deps, deps)) {
        const previous = slots[index];
        slots[index] = { deps };
        effects.push(() => {
          previous?.cleanup?.();
          slots[index].cleanup = effect();
        });
      }
    },
  };
  const source = fs.readFileSync(path.resolve(__dirname, "..", file), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText;
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", compiled)((name) => {
    if (name === "react") return react;
    if (name in mocks) return mocks[name];
    throw new Error(`Unexpected dependency: ${name}`);
  }, compiledModule, compiledModule.exports);
  return {
    render(props) { cursor = 0; return compiledModule.exports[exportName](props); },
    flushEffects() { const queued = effects; effects = []; queued.forEach((effect) => effect()); },
    unmount() { slots.forEach((slot) => slot.cleanup?.()); },
  };
}

const selectionHook = "features/payroll/hooks/usePayrollWorkspaceSelection.ts";
const settle = () => new Promise((resolve) => setImmediate(resolve));

test("draft loading covers the first render and waits for workspace hydration", async () => {
  const request = deferred();
  let calls = 0;
  const props = { hydrated: false, importId: "import-1", runId: "run-1", selectAttendanceWorkspace: () => { calls++; return request.promise; } };
  const runner = hookRunner(selectionHook, "usePayrollWorkspaceSelection");
  assert.equal(runner.render(props).isOpeningDraft, true);
  runner.flushEffects();
  assert.equal(calls, 0);
  props.hydrated = true;
  assert.equal(runner.render(props).isOpeningDraft, true);
  runner.flushEffects();
  assert.equal(calls, 1);
  props.selectAttendanceWorkspace = () => { calls++; return request.promise; };
  assert.equal(runner.render(props).isOpeningDraft, true);
  runner.flushEffects();
  assert.equal(calls, 1, "provider rerenders must not restart an in-flight selection");
  request.resolve(true);
  await settle();
  assert.equal(runner.render(props).isOpeningDraft, false);
  runner.unmount();
});

test("failed draft selections end loading and can be retried", async () => {
  let calls = 0;
  const props = { hydrated: true, importId: "import-1", runId: "run-1", selectAttendanceWorkspace: async () => ++calls > 1 };
  const runner = hookRunner(selectionHook, "usePayrollWorkspaceSelection");
  runner.render(props);
  runner.flushEffects();
  await settle();
  const failed = runner.render(props);
  assert.equal(failed.isOpeningDraft, false);
  assert.match(failed.error, /Unable to open/);
  failed.retry();
  assert.equal(runner.render(props).isOpeningDraft, true);
  runner.flushEffects();
  await settle();
  assert.equal(runner.render(props).error, null);
  assert.equal(calls, 2);
  runner.unmount();
});

test("an older selection response cannot dismiss the current draft's skeleton", async () => {
  const first = deferred(), second = deferred();
  const props = { hydrated: true, importId: "import-1", runId: "run-1", selectAttendanceWorkspace: (id) => id === "import-1" ? first.promise : second.promise };
  const runner = hookRunner(selectionHook, "usePayrollWorkspaceSelection");
  runner.render(props);
  runner.flushEffects();
  props.importId = "import-2";
  props.runId = "run-2";
  runner.render(props);
  runner.flushEffects();
  first.resolve(true);
  await settle();
  assert.equal(runner.render(props).isOpeningDraft, true);
  second.resolve(true);
  await settle();
  assert.equal(runner.render(props).isOpeningDraft, false);
  runner.unmount();
});

test("saved adjustments finish before the draft is ready to display", async () => {
  const items = deferred(), adjustments = deferred();
  let overrides = {};
  const totals = {
    round2: (value) => Math.round(value * 100) / 100,
    sumCashAdvance: (entries) => entries.reduce((total, entry) => total + entry.amount, 0),
    sumPaidLeavePay: (entries) => entries.reduce((total, entry) => total + entry.pay, 0),
    sumOvertimePay: (entries, status) => entries.filter((entry) => entry.status === status).reduce((total, entry) => total + entry.pay, 0),
    sumOvertimeHours: (entries, status) => entries.filter((entry) => entry.status === status).reduce((total, entry) => total + entry.hours, 0),
  };
  const runner = hookRunner("features/payroll/hooks/useSavedPayrollDraft.ts", "useSavedPayrollDraft", {
    "@/lib/supabase/browser": { createSupabaseBrowserClient: () => ({ from: (table) => ({ select: () => ({ eq: () => table === "payroll_run_items" ? items.promise : { in: () => adjustments.promise } }) }) }) },
    "../utils/payrollMappers": { normalizeEmployeeNameKey: (value) => value.trim().toLowerCase() },
    "../utils/payrollSelectors": { FULL_WORKDAY_HOURS: 8 },
    "../utils/payrollAdjustmentTotals": totals,
  });
  const props = { currentPayrollRunId: "run-1", payrollBaseRows: [{ id: "row-1", worker: "Adam", role: "W", site: "Site A", date: "2026-08-20", customRate: null }], setPayrollOverrides: (update) => { overrides = update(overrides); } };
  assert.equal(runner.render(props).isRestoringSavedDraft, true);
  runner.flushEffects();
  items.resolve({ data: [{ id: "item-1", employee_name: "Adam", role_code: "W", site_name: "Site A", hours_worked: 32, overtime_hours: 2, rate_per_day: 500, holiday_pay: 0, deductions_total: 0 }], error: null });
  await settle();
  assert.equal(runner.render(props).isRestoringSavedDraft, true);
  adjustments.resolve({ data: [{ id: "adjustment-1", payroll_run_item_id: "item-1", adjustment_type: "cash_advance", status: "approved", amount: 250, quantity: 0, notes: "Saved" }], error: null });
  await settle();
  assert.equal(runner.render(props).isRestoringSavedDraft, false);
  assert.equal(overrides["row-1"].hoursWorked, 32);
  assert.equal(overrides["row-1"].cashAdvanceTotal, 250);
  assert.equal(overrides["row-1"].customRate, 62.5);
  runner.unmount();
});
