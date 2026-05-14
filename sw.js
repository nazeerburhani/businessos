// BusinessOS Service Worker — Offline Cache Strategy
const CACHE_NAME = 'businessos-v4';
const STATIC_ASSETS = ['/', '/index.html'];

// Install: pre-cache shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Network first, fallback to cache (for API), Cache first for assets
self.addEventListener('fetch', (e) => {
  // Skip non-GET and chrome-extension requests
  if (e.request.method !== 'GET' || e.request.url.startsWith('chrome-extension')) return;

  const url = new URL(e.request.url);

  // For JS/CSS/image assets — cache first
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return resp;
        });
      })
    );
    return;
  }

  // For navigation — network first, fallback to index.html (SPA)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Default — stale while revalidate
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});

// Push notifications from server (future use)
self.addEventListener('push', (e) => {
  const data = e.data?.json() || {};
  self.registration.showNotification(data.title || 'BusinessOS', {
    body: data.body || 'You have a new alert.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  });
});
