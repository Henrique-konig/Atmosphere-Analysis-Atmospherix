// Service worker: makes the app installable, keeps the last forecast available offline and
// opens the app from its weather notifications.
const VERSION = "v2";
const SHELL = `atmospherix-shell-${VERSION}`;
const RUNTIME = `atmospherix-runtime-${VERSION}`;
const PRECACHE = ["/", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== SHELL && key !== RUNTIME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** A copy stamped with the time it was fetched, so the page can say how old it is. */
async function stamped(response) {
  const headers = new Headers(response.headers);
  headers.set("x-atmospherix-saved-at", String(Date.now()));
  return new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Fresh data when online; the last saved copy when offline. */
async function networkFirst(request, fallbackUrl, stamp = false) {
  const cache = await caches.open(RUNTIME);
  try {
    const response = await fetch(request);
    if (response.ok) {
      const copy = response.clone();
      (stamp ? stamped(copy) : Promise.resolve(copy)).then((r) => cache.put(request, r));
    }
    return response;
  } catch (err) {
    const cached =
      (await cache.match(request)) || (fallbackUrl && (await caches.match(fallbackUrl)));
    if (cached) return cached;
    throw err;
  }
}

/** Build files have hashed names and never change: serve them from the cache. */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(RUNTIME)).put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // Map tiles and other services handle their own caching.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "/"));
  } else if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, undefined, true));
  } else if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
  }
});

/** Tapping a notification brings the open app forward, or opens it. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url ?? "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      return open ? open.focus() : self.clients.openWindow(url);
    }),
  );
});
