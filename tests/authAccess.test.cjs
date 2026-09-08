const assert = require("node:assert/strict");
const test = require("node:test");
const { NextRequest } = require("next/server");
const load = require("./helpers/loadGmeaModule.cjs");

const userId = "11111111-1111-4111-8111-111111111111";
const roleHomes = {
  gmea: "/gmea-projects",
  admin: "/add-user",
  ceo: "/dashboard",
  payroll_manager: "/payroll-dashboard",
  purchaser: "/purchaser-dashboard",
  engineer: "/overview",
  employee: "/home",
};

function loadAuth(profile) {
  return load("lib/auth.ts", {
    react: { cache: (callback) => callback },
    "next/navigation": {
      redirect: (path) => {
        throw new Error(`REDIRECT:${path}`);
      },
    },
    "next/headers": { headers: async () => new Headers() },
    "@/lib/supabase/requestAuthContext": {
      readRequestUser: () => ({ id: userId }),
      readRequestProfile: () => profile,
    },
    "@/lib/supabase/server": {},
  });
}

async function runMiddleware(profile, pathname) {
  let signedOut = false;
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
          getUser: async () => ({ data: { user: { id: userId } } }),
          signOut: async () => {
            signedOut = true;
            return { error: null };
          },
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: profile, error: null }),
            }),
          }),
        }),
      }),
    },
  });

  const response = await updateSession(
    new NextRequest(`http://localhost${pathname}`),
  );
  return { response, signedOut };
}

test("every active account role has a valid login destination", async () => {
  for (const [role, expectedPath] of Object.entries(roleHomes)) {
    const profile = { id: userId, role, is_active: true };
    const auth = loadAuth(profile);
    assert.equal(auth.getRoleHomePath(role), expectedPath);

    const { response, signedOut } = await runMiddleware(profile, "/auth/login");
    assert.equal(
      new URL(response.headers.get("location")).pathname,
      expectedPath,
    );
    assert.equal(signedOut, false);
  }
});

test("inactive accounts cannot pass server role checks", async () => {
  const auth = loadAuth({ id: userId, role: "ceo", is_active: false });
  await assert.rejects(auth.requireRole("ceo"), /REDIRECT:\/auth\/login/);
});

test("middleware clears invalid authenticated sessions", async () => {
  for (const profile of [
    null,
    { id: userId, role: "ceo", is_active: false },
  ]) {
    const { response, signedOut } = await runMiddleware(profile, "/dashboard");
    const location = new URL(response.headers.get("location"));
    assert.equal(location.pathname, "/auth/login");
    assert.equal(
      location.searchParams.get("error"),
      profile ? "inactive" : "profile",
    );
    assert.equal(signedOut, true);
  }
});

test("public sign-in can switch away from the current account", async () => {
  const profile = { id: userId, role: "gmea", is_active: true };
  const { response, signedOut } = await runMiddleware(
    profile,
    "/auth/login?switch=1",
  );
  const location = new URL(response.headers.get("location"));

  assert.equal(location.pathname, "/auth/login");
  assert.equal(location.search, "");
  assert.equal(signedOut, true);
});
