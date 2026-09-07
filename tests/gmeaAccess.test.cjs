const assert = require("node:assert/strict"),
  test = require("node:test");
const load = require("./helpers/loadGmeaModule.cjs");
const { NextRequest } = require("next/server");
const id = "11111111-1111-4111-8111-111111111111";

function authFor(role, is_active = true) {
  const profile = { id, role, is_active };
  return load("lib/auth.ts", {
    react: { cache: (fn) => fn },
    "next/navigation": {
      redirect: (path) => {
        throw new Error("REDIRECT:" + path);
      },
    },
    "next/headers": { headers: async () => new Headers() },
    "@/lib/supabase/requestAuthContext": {
      readRequestUser: () => ({ id }),
      readRequestProfile: () => profile,
    },
    "@/lib/supabase/server": {},
  });
}
test("GMEA role home and server access agree; CEO cannot mutate", async () => {
  for (const role of ["gmea", "ceo", "engineer", "admin"]) {
    const auth = authFor(role);
    const { requireGmeaAccess } = load(
      "features/gmea-projects/server/gmeaQueries.ts",
      {
        "server-only": {},
        "@/lib/auth": auth,
        "./gmeaDatabase": {},
      },
    );
    if (role === "gmea") {
      assert.equal(auth.getRoleHomePath(role), "/gmea-projects");
      await requireGmeaAccess(true);
    } else await assert.rejects(requireGmeaAccess(true), /REDIRECT/);
    if (["gmea", "ceo"].includes(role)) await requireGmeaAccess();
    else await assert.rejects(requireGmeaAccess(), /REDIRECT/);
  }
  const { requireGmeaAccess } = load(
    "features/gmea-projects/server/gmeaQueries.ts",
    {
      "server-only": {},
      "@/lib/auth": authFor("gmea", false),
      "./gmeaDatabase": {},
    },
  );
  await assert.rejects(requireGmeaAccess(true), /inactive/);
});
test("middleware redirects unauthenticated and unauthorized roles and allows GMEA paths", async () => {
  async function request(role, pathname) {
    const { updateSession } = load("lib/supabase/middleware.ts", {
      "@/lib/env": {
        getSupabaseBrowserEnv: () => ({
          url: "https://example.supabase.co",
          anonKey: "test",
        }),
      },
      "@supabase/ssr": {
        createServerClient: () => ({
          auth: {
            getUser: async () => ({ data: { user: role ? { id } : null } }),
          },
          from: () => ({
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id, role, is_active: true },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      },
    });
    return updateSession(new NextRequest("http://localhost" + pathname));
  }
  assert.match(
    (await request(null, "/gmea-projects")).headers.get("location"),
    /auth\/login/,
  );
  assert.match(
    (await request("engineer", "/gmea-projects")).headers.get("location"),
    /overview/,
  );
  assert.match(
    (await request("gmea", "/dashboard")).headers.get("location"),
    /gmea-projects/,
  );
  assert.match(
    (await request("gmea", "/auth/login")).headers.get("location"),
    /gmea-projects/,
  );
  for (const role of ["gmea", "ceo"])
    assert.equal(
      (await request(role, "/gmea-projects/" + id)).headers.get("location"),
      null,
    );
  assert.equal(
    (await request("gmea", "/settings")).headers.get("location"),
    null,
  );
});
test("Admin account creation accepts GMEA and normalizes username/email", async () => {
  let inserted, created;
  const auth = authFor("admin");
  const db = {
    auth: {
      admin: {
        createUser: async (value) => {
          created = value;
          return { data: { user: { id } }, error: null };
        },
      },
    },
    from: () => ({
      insert: async (value) => {
        inserted = value;
        return { error: null };
      },
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null }),
          single: async () => ({ data: inserted, error: null }),
        }),
      }),
    }),
  };
  const { createAppUserAction } = load("actions/users.ts", {
    "@/lib/auth": auth,
    "@/lib/supabase/server": { createSupabaseAdminClient: () => db },
    "next/cache": { revalidatePath: () => {} },
  });
  const r = await createAppUserAction({
    fullName: " GMEA ",
    username: " GMEA ",
    email: " GMEA@Example.test ",
    password: "Example-Only-123",
    role: "gmea",
  });
  assert.equal(r.user.role, "gmea");
  assert.equal(inserted.username, "gmea");
  assert.equal(created.email, "gmea@example.test");
});
test("financial reads paginate rather than silently truncating at API row limits", async () => {
  const { readAllGmeaRows } = load(
    "features/gmea-projects/server/readAllGmeaRows.ts",
    { "server-only": {} },
  );
  const rows = Array.from({ length: 1250 }, (_, i) => ({ id: i })),
    calls = [];
  const result = await readAllGmeaRows(async (from, to) => {
    calls.push([from, to]);
    return { data: rows.slice(from, to + 1), error: null };
  });
  assert.equal(result.length, 1250);
  assert.deepEqual(calls, [
    [0, 499],
    [500, 999],
    [1000, 1499],
  ]);
  await assert.rejects(
    readAllGmeaRows(async () => ({
      data: null,
      error: { message: "Connection failed" },
    })),
    /Connection failed/,
  );
});
