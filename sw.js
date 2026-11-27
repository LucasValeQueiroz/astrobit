/**
 * AstroBit Offline-First Service Worker (zero-dependency PWA).
 * Uses Stale-While-Revalidate for same-origin static assets so kids can play offline
 * on tablets, cars, or classrooms while always bypassing external Firebase/Google APIs.
 */

const CACHE_NAME = 'astrobit-pwa-v2.6';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icon-512.svg',
  './src/css/styles.css',
  './src/app.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Always bypass external APIs (Firebase Auth, Firestore, gstatic CDN)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req);
      const networkPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(req, res.clone()).catch(() => {});
          }
          return res;
        })
        .catch(() => null);

      return cached || (await networkPromise) || new Response('Offline', { status: 503 });
    })
  );
});
