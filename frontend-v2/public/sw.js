const CACHE_NAME = 'promanager-v1';
const STATIC_ASSETS = ['/', '/dashboard'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first strategy — fallback to cache for navigation requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Skip non-GET and API requests
  if (request.method !== 'GET' || request.url.includes('/api/')) return;

  event.respondWith(
    fetch(request)
      .then((res) => {
        // Cache successful responses for navigation
        if (request.mode === 'navigate') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});
