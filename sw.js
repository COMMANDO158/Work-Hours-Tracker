// FlowFocus service worker.
// Bump CACHE_VERSION on every deploy. The app shell is precached in one
// versioned cache; pages, styles and scripts are then fetched network-first
// (see the fetch handler), so the cache is the offline fallback.
const CACHE_VERSION = 'v18';
const CACHE_NAME = `flowfocus-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './weekly-reflection.html',
  './manifest.json',
  './css/tokens.css',
  './css/base.css',
  './css/components.css',
  './css/views.css',
  './css/gems.css',
  './js/app.js',
  './js/backup.js',
  './js/breaks.js',
  './js/config.js',
  './js/dates.js',
  './js/format.js',
  './js/gem-cuts.js',
  './js/gems.js',
  './js/gist.js',
  './js/insights.js',
  './js/lock.js',
  './js/merge.js',
  './js/state.js',
  './js/storage.js',
  './js/store.js',
  './js/sync.js',
  './js/timer.js',
  './js/today-state.js',
  './js/ui/dom.js',
  './js/ui/gem.js',
  './js/ui/insights-view.js',
  './js/ui/log.js',
  './js/ui/numeral.js',
  './js/ui/settings.js',
  './js/ui/shell.js',
  './js/ui/today.js',
  './js/ui/words.js',
  './assets/fonts/barlow-condensed-700-latin.woff2',
  './assets/fonts/barlow-400-latin.woff2',
  './assets/fonts/barlow-500-latin.woff2',
  './assets/fonts/barlow-600-latin.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // cache: 'reload' skips the HTTP cache, so a fresh deploy is never precached stale.
      .then((cache) => cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: 'reload' }))))
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

  // Everything cross-origin, above all api.github.com (sync), goes straight to
  // the network: caching it would store private data and serve stale syncs.
  if (url.origin !== self.location.origin) return;

  // The pages, styles and scripts go network-first, so a restyle shows on the
  // very next load instead of whatever the cache holds. The cache is the
  // offline (or slow-network) fallback only. 'no-cache' revalidates past
  // GitHub Pages' 10-minute HTTP cache.
  if (request.mode === 'navigate' || /\.(?:html|css|js|json)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const fallback = async () => (await cache.match(request, { ignoreSearch: true }))
          || (request.mode === 'navigate' && (await cache.match('./index.html')))
          || Response.error();
        try {
          const ctl = new AbortController();
          const timer = setTimeout(() => ctl.abort(), 4000);
          const response = await fetch(request.url, { cache: 'no-cache', signal: ctl.signal });
          clearTimeout(timer);
          if (response.ok && response.type === 'basic') {
            cache.put(request, response.clone());
            return response;
          }
          return (await cache.match(request, { ignoreSearch: true })) || response;
        } catch {
          return fallback();
        }
      })
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') cache.put(request, response.clone());
      return response;
    })
  );
});
