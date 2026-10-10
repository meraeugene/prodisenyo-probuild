const assert = require("node:assert/strict"), test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");

// Exercise the confirmation controller without sending any mutations to live data.
function confirmationHarness(onConfirm) {
  const slots = []; let cursor = 0;
  const state = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ?? (slots[index] = { current: initial }); },
  };
  const Action = load("features/gmea-rentals/components/GmeaRentalConfirmAction.tsx", {
    react: state, "./GmeaRentalsDialog": { default: () => null },
  }).default;
  function render() {
    cursor = 0;
    const children = Action({ label: "Deactivate equipment", triggerLabel: "Deactivate", description: "Keep history", pendingLabel: "Deactivating…", onConfirm }).props.children;
    return { trigger: children[0].props, dialog: children[1]?.props };
  }
  return { render };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test("opening or canceling a confirmation never runs the destructive action", () => {
  let calls = 0; const ui = confirmationHarness(async () => { calls++; });
  ui.render().trigger.onClick();
  assert.equal(calls, 0); assert.ok(ui.render().dialog);
  ui.render().dialog.onClose();
  assert.equal(calls, 0); assert.equal(ui.render().dialog, undefined);
});

test("confirmation awaits the action, blocks duplicate submissions, and keeps the modal locked while pending", async () => {
  let calls = 0, finish;
  const deferred = new Promise(resolve => { finish = resolve; });
  const ui = confirmationHarness(() => { calls++; return deferred; });
  ui.render().trigger.onClick();
  ui.render().dialog.onSave(); ui.render().dialog.onSave();
  const busy = ui.render();
  assert.equal(calls, 1); assert.equal(busy.trigger.disabled, true); assert.equal(busy.trigger["aria-busy"], true);
  assert.equal(busy.dialog.pending, true); assert.equal(busy.dialog.pendingLabel, "Deactivating…");
  finish(); await tick();
  assert.equal(ui.render().dialog, undefined); assert.equal(ui.render().trigger.disabled, false);
});

test("failed mutations stay open with an error and allow a deliberate retry", async () => {
  let calls = 0;
  const ui = confirmationHarness(async () => { if (++calls === 1) throw new Error("Record changed. Reload first."); });
  ui.render().trigger.onClick(); ui.render().dialog.onSave(); await tick();
  const failed = ui.render();
  assert.ok(failed.dialog); assert.equal(failed.dialog.pending, false); assert.equal(failed.dialog.error, "Record changed. Reload first.");
  failed.dialog.onSave(); await tick();
  assert.equal(calls, 2); assert.equal(ui.render().dialog, undefined);
});
