const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

function worker({ cached, response = new Response("asset"), keys = [] } = {}) {
  const handlers = {};
  const calls = { fetched: [], stored: [], deleted: [], claimed: 0 };
  const cache = {
    match: async () => cached,
    put: async (request) => { calls.stored.push(request.url); },
    addAll: async () => {},
  };
  vm.runInNewContext(fs.readFileSync("public/sw.js", "utf8"), {
    URL,
    self: {
      location: { origin: "https://probuild.test" },
      addEventListener: (name, handler) => { handlers[name] = handler; },
      skipWaiting: () => {},
      clients: { claim: async () => { calls.claimed += 1; } },
    },
    caches: {
      open: async () => cache,
      keys: async () => keys,
      delete: async (key) => { calls.deleted.push(key); },
    },
    fetch: async (request) => { calls.fetched.push(request.url); return response; },
  });
  function request(path, { mode = "cors", method = "GET", headers = {} } = {}) {
    let result;
    handlers.fetch({
      request: { url: new URL(path, "https://probuild.test").href, mode, method, headers: new Headers(headers) },
      respondWith: (promise) => { result = promise; },
    });
    return result;
  }
  return { handlers, calls, request };
}

test("authenticated routes and RSC navigation bypass service-worker caching for every role", () => {
  const { request, calls } = worker({ cached: new Response("old session") });
  for (const path of ["/dashboard", "/add-user", "/gmea-projects", "/payroll-workspace", "/overview", "/purchaser-dashboard", "/home", "/settings"]) {
    assert.equal(request(path, { mode: "navigate" }), undefined, path);
    assert.equal(request(path, { headers: { RSC: "1" } }), undefined, path);
    assert.equal(request(`${path}?_rsc=prefetch`), undefined, path);
  }
  for (const path of ["/_next/static/chunks/app.js", "/api/profile", "/auth/login", "/sw.js"]) {
    assert.equal(request(path), undefined, path);
  }
  assert.equal(request("/pwa.png?_rsc=prefetch"), undefined);
  assert.equal(request("/pwa.png", { headers: { RSC: "1" } }), undefined);
  assert.equal(request("/pwa.png", { mode: "navigate" }), undefined);
  assert.equal(request("/dashboard", { method: "POST" }), undefined);
  assert.equal(request("https://other.test/pwa.png"), undefined);
  assert.deepEqual(calls.fetched, []);
  assert.deepEqual(calls.stored, []);
});

test("static assets reuse cache and successful downloads populate it", async () => {
  const cached = new Response("cached logo");
  const hit = worker({ cached });
  assert.equal(await hit.request("/pwa.png"), cached);
  assert.deepEqual(hit.calls.fetched, []);
  const miss = worker();
  assert.equal(await (await miss.request("/pwa.png")).text(), "asset");
  assert.deepEqual(miss.calls.stored, ["https://probuild.test/pwa.png"]);
});

test("failed asset requests do not poison the cache", async () => {
  const { request, calls } = worker({ response: new Response("missing", { status: 404 }) });
  assert.equal((await request("/missing.png")).status, 404);
  assert.deepEqual(calls.stored, []);
});

test("activation removes old app caches and preserves unrelated caches", async () => {
  const { handlers, calls } = worker({ keys: ["prodisenyo-static-v2", "prodisenyo-dynamic-v2", "prodisenyo-static-v3", "other-app"] });
  let done;
  handlers.activate({ waitUntil: (promise) => { done = promise; } });
  await done;
  assert.deepEqual(calls.deleted, ["prodisenyo-static-v2", "prodisenyo-dynamic-v2"]);
  assert.equal(calls.claimed, 1);
});
