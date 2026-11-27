/**
 * AstroBit Offline-First Service Worker (zero-dependency PWA).
 * Uses Stale-While-Revalidate for same-origin static assets so kids can play offline
 * on tablets, cars, or classrooms while always bypassing external Firebase/Google APIs.
 */

const CACHE_NAME = 'astrobit-pwa-v2.8';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icon-512.svg',
  './src/css/styles.css',
  './src/css/world8-twins.css',
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

  // Network-First for same-origin assets so online players always get the latest release immediately,
  // with instant offline cache fallback when disconnected.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.status === 200 && fresh.type === 'basic') {
          cache.put(req, fresh.clone()).catch(() => {});
        }
        return fresh;
      } catch {
        const cached = await cache.match(req);
        return cached || new Response('Offline', { status: 503 });
      }
    })
  );
});
