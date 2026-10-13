const test = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/loadGmeaModule.cjs");

function setup() {
  const calls = [], writes = [];
  const database = {
    rpc: async (name, input) => { calls.push({ name, input }); return { data: { id: "new-project" }, error: null }; },
    from(table) {
      const query = {
        select: () => query, eq: () => query,
        maybeSingle: async () => ({ data: { status: "active" }, error: null }),
        update: input => { writes.push({ table, input }); return query; },
        then: resolve => Promise.resolve({ error: null }).then(resolve),
      };
      return query;
    },
  };
  const actions = load("actions/projects.ts", {
    "@/lib/auth": { APP_ROLES: { CEO: "ceo" }, requireRole: async () => ({ user: { id: "ceo" } }) },
    "@/lib/supabase/server": { createSupabaseAdminClient: () => database },
    "next/cache": { revalidatePath() {} },
  });
  return { actions, calls, writes };
}

const input = { name: "Warehouse", location: "Manila", lead: "Engineer One", estimateEngineerId: "engineer-1", engineerId: "engineer-1", budget: 100000, startDate: "2026-10-12", endDate: "2026-12-12" };

test("CEO creation assigns a planning project without using image storage", async () => {
  const { actions, calls, writes } = setup();
  await actions.createProjectAction(input);
  assert.equal(calls[0].input.p_image_url, null);
  assert.equal(calls[0].input.p_estimate_engineer, "engineer-1");
  assert.equal(writes[0].input.status, "planning");
  assert.equal(writes[0].input.assigned_estimate_engineer_id, "engineer-1");
});

test("CEO reassignment updates the engineer without requiring or overwriting a stored image", async () => {
  const { actions, writes } = setup();
  await actions.updateProjectAction("existing-project", input);
  assert.equal(writes[0].input.assigned_engineer_id, "engineer-1");
  assert.equal(Object.hasOwn(writes[0].input, "image_url"), false);
});
