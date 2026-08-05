/* Shyam Bhajan Sangrah — service worker */
const CACHE = "bhajan-shell-v16";
const CORE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./pdfjs/pdf.min.js", "./pdfjs/pdf.worker.min.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  // Never intercept Firestore/Google API traffic — Firestore has its own offline cache
  if (url.hostname.includes("googleapis.com") || url.hostname.includes("firestore")) return;

  // App shell (same-origin): STALE-WHILE-REVALIDATE — respond instantly from
  // cache (fixes "app frozen after coming back from YouTube"), refresh in background
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then((hit) => {
        const net = fetch(e.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
            return res;
          })
          .catch(() => hit || caches.match("./index.html"));
        return hit || net;
      })
    );
    return;
  }

  // Fonts, thumbnails, SDK, tanpura/tabla recordings: cache first, then network
  if (
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com") ||
    url.hostname.includes("img.youtube.com") ||
    url.hostname.includes("ragajunglism.org") ||
    url.hostname.includes("cdnjs.cloudflare.com") ||
    url.hostname.includes("archive.org") ||
    url.hostname.includes("cdn.jsdelivr.net") ||
    url.hostname.includes("tessdata.projectnaptha.com") ||
    url.hostname.includes("gstatic.com")
  ) {
    e.respondWith(
      caches.match(e.request).then(
        (hit) =>
          hit ||
          fetch(e.request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
            return res;
          })
      )
    );
  }
});
