const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");

function setup({ project = { id: "project", name: "Warehouse", location: "Manila" }, projectError = null, owner = "engineer", status = "rejected", updateError = null, authError = null } = {}) {
  const writes = [], filters = [], paths = [];
  const estimate = { id: "estimate", requested_by: owner, project_id: "project", status };
  const database = { from(table) {
    let mutation;
    const query = {
      select() { return query; },
      eq(key, value) { filters.push({ table, key, value }); return query; },
      or() { return query; }, limit() { return query; }, order() { return query; },
      update(payload) { mutation = payload; writes.push({ table, payload }); return query; },
      insert(payload) { writes.push({ table, payload }); return Promise.resolve({ error: null }); },
      single() { return Promise.resolve({ data: mutation ? { ...estimate, ...mutation } : estimate, error: mutation ? updateError : null }); },
      maybeSingle() { return Promise.resolve({ data: project, error: projectError }); },
      then(resolve) { return Promise.resolve({ data: [], error: null }).then(resolve); },
    };
    return query;
  } };
  const actions = load("actions/costEstimator.ts", {
    "server-only": {},
    "@/lib/auth": { APP_ROLES: { ENGINEER: "engineer" }, requireRole: async () => { if (authError) throw authError; return { user: { id: "engineer" } }; } },
    "@/lib/supabase/server": { createSupabaseAdminClient: () => database },
    "next/cache": { revalidatePath: route => paths.push(route) },
  });
  return { actions, writes, filters, paths };
}

test("completed or no longer assigned projects return a readable BOQ reopen error without writes", async () => {
  const context = setup({ project: null });
  const result = await context.actions.reopenRejectedEstimateAction("estimate");
  assert.deepEqual(result, { success: false, error: "Cost estimation is available only while the assigned project is pending." });
  assert.deepEqual(context.writes, []);
  assert.ok(context.filters.some(filter => filter.key === "status" && filter.value === "planning"));
  assert.ok(context.filters.some(filter => filter.key === "assigned_estimate_engineer_id" && filter.value === "engineer"));
});

test("an assigned planning project's returned BOQ reopens as a draft with its items", async () => {
  const context = setup();
  const result = await context.actions.reopenRejectedEstimateAction("estimate");
  assert.equal(result.success, true);
  assert.equal(result.estimate.status, "draft");
  assert.deepEqual(result.items, []);
  assert.equal(context.writes[0].payload.rejection_reason, null);
  assert.equal(context.writes[1].table, "audit_logs");
  assert.ok(context.paths.includes("/cost-estimator"));
});

test("engineers cannot reopen someone else's BOQ or an approved estimate", async () => {
  for (const options of [{ owner: "another-engineer" }, { status: "approved" }]) {
    const context = setup(options);
    const result = await context.actions.reopenRejectedEstimateAction("estimate");
    assert.equal(result.success, false);
    assert.deepEqual(context.writes, []);
  }
});

test("saving an estimate for a completed project returns a readable error without writes", async () => {
  const context = setup({ project: null, status: "draft" });
  const result = await context.actions.saveProjectEstimateDraftAction({ id: "estimate", projectId: "project", items: [] });
  assert.deepEqual(result, { success: false, error: "Select a project assigned to you before saving an estimate." });
  assert.deepEqual(context.writes, []);
});

test("unexpected database failures return a safe message and log server details", async t => {
  const logs = [];
  t.mock.method(console, "error", (...args) => logs.push(args));
  const context = setup({ projectError: { message: "private database detail" } });
  const result = await context.actions.reopenRejectedEstimateAction("estimate");
  assert.deepEqual(result, { success: false, error: "Unable to reopen this estimate. Please try again." });
  assert.ok(logs[0][1].message.includes("private database detail"));
  assert.deepEqual(context.writes, []);
});

test("authentication redirects propagate instead of becoming mutation messages", async () => {
  const redirect = new Error("NEXT_REDIRECT");
  const context = setup({ authError: redirect });
  await assert.rejects(context.actions.reopenRejectedEstimateAction("estimate"), error => error === redirect);
  assert.deepEqual(context.writes, []);
});

test("the client preserves the safe action message instead of a masked server exception", () => {
  const { requireSuccessfulEstimateMutation } = load("features/cost-estimator/utils/estimateMutationResult.ts");
  assert.throws(() => requireSuccessfulEstimateMutation({ success: false, error: "Only draft estimates can be edited." }), /Only draft estimates can be edited/);
  const success = { success: true, estimate: { id: "estimate" }, items: [] };
  assert.equal(requireSuccessfulEstimateMutation(success), success);
});
