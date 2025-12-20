// Service Worker Configuration for Critical Page Caching
const CACHE_NAME = 'rangaone-critical-v1';
const CRITICAL_ROUTES = [
  '/login',
  '/signup',
  '/dashboard',
];

const CRITICAL_ASSETS = [
  '/landing-page/rlogodark.png',
  '/landing-page/namelogodark.png',
  '/login-bg.png',
  '/signup-bg.png',
  '/google.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([...CRITICAL_ROUTES, ...CRITICAL_ASSETS]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only cache critical routes and assets
  if (CRITICAL_ROUTES.includes(url.pathname) || CRITICAL_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});
