/* Shyam Bhajan Sangrah — service worker (v30)
   Goals: instant open (app shell served from cache), never fail to install
   because of a missing file, and no surprise reloads. */
const VERSION = "v33";
const SHELL = `bhajan-shell-${VERSION}`;
const ASSETS = `bhajan-assets-${VERSION}`;

/* Files that make up the app shell. Missing files are skipped, not fatal. */
const CORE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

/* Third-party hosts whose responses are safe to keep for a long time. */
const ASSET_HOSTS = [
  "fonts.googleapis.com", "fonts.gstatic.com", "www.gstatic.com", "gstatic.com",
  "img.youtube.com", "i.ytimg.com", "ragajunglism.org", "cdnjs.cloudflare.com",
  "cdn.jsdelivr.net", "archive.org", "tessdata.projectnaptha.com"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    await Promise.all(CORE.map(async (u) => {
      try { const r = await fetch(u, { cache: "no-cache" }); if (r.ok) await c.put(u, r); } catch {}
    }));
    /* Do NOT skipWaiting here — the page decides when to update, so a new
       version never swaps in mid-session. */
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== SHELL && k !== ASSETS).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

const putSafe = async (cacheName, req, res) => {
  try { if (res && res.ok) { const c = await caches.open(cacheName); await c.put(req, res.clone()); } } catch {}
  return res;
};

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  /* Firestore / Google APIs manage their own offline cache — never intercept. */
  if (url.hostname.includes("googleapis.com") || url.hostname.includes("firestore")) return;

  /* App shell: stale-while-revalidate. Cached copy answers instantly,
     the network copy refreshes the cache for next time. */
  if (url.origin === location.origin) {
    e.respondWith((async () => {
      const cached = await caches.match(req, { ignoreSearch: req.mode === "navigate" });
      const network = fetch(req).then((res) => putSafe(SHELL, req, res)).catch(() => null);
      if (cached) { e.waitUntil(network); return cached; }
      const res = await network;
      if (res) return res;
      return (await caches.match("./index.html")) || Response.error();
    })());
    return;
  }

  /* Fonts, SDK, thumbnails, tanpura/tabla samples: cache first. */
  if (ASSET_HOSTS.some((h) => url.hostname.includes(h))) {
    e.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try { return await putSafe(ASSETS, req, await fetch(req)); }
      catch { return Response.error(); }
    })());
  }
});
