// FlowFocus service worker
// Bump CACHE_VERSION whenever index.html / weekly-reflection.html change
// so returning users automatically pick up the new version.
const CACHE_VERSION = 'v2';
const CACHE_NAME = `flowfocus-${CACHE_VERSION}`;

const STATIC_CDN_HOSTS = [
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net'
];

const APP_SHELL = [
  './',
  './index.html',
  './weekly-reflection.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith('flowfocus-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // HTML navigations: network-first so users get the latest build when
  // online, with an offline fallback to the cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // Same-origin static assets (icons, manifest): cache-first.
  if (isSameOrigin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        });
      })
    );
    return;
  }

  // Only ever cache known static-asset CDNs. Everything else cross-origin —
  // above all api.github.com (cloud sync) — must go straight to the network:
  // caching it would store private data and could serve stale sync responses.
  if (!STATIC_CDN_HOSTS.includes(url.hostname)) return;

  // Cross-origin static assets (fonts, Font Awesome, Chart.js): try the network,
  // fall back to cache if we've seen it before, otherwise let it fail quietly —
  // the app's core functionality never depends on these loading.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
