const STATIC_CACHE = "prodisenyo-static-v3";
const PRECACHE_URLS = ["/manifest.webmanifest", "/icon.ico", "/pwa.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith("prodisenyo-") && key !== STATIC_CACHE)
        .map((key) => caches.delete(key)),
    )).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Let Next.js and the browser manage pages, RSC responses and build chunks.
  // Caching route responses here bypasses router invalidation and can reuse
  // another session's response or an old deployment's route payload.
  if (
    request.mode === "navigate" ||
    request.headers.get("RSC") === "1" ||
    url.searchParams.has("_rsc") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/")
  ) return;

  const isStaticAsset = PRECACHE_URLS.includes(url.pathname) ||
    /\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?|mp3|wav)$/i.test(url.pathname);
  if (!isStaticAsset) return;

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok && !response.redirected) {
        await cache.put(request, response.clone()).catch(() => undefined);
      }
      return response;
    }),
  );
});
