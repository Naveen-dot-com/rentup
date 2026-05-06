// RentUp v2 — Service Worker
const CACHE_NAME = 'rentup-v19';
const ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/billing.html',
  '/properties.html',
  '/rooms.html',
  '/settings.html',
  '/css/style.css',
  '/js/i18n.js',
  '/js/api.js',
  '/js/utils.js',
  '/js/auth.js',
  '/js/dashboard.js',
  '/js/billing.js',
  '/js/properties.js',
  '/js/rooms.js',
  '/js/settings.js',
  '/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
