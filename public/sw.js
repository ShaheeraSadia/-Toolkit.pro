const CACHE_NAME = 'toolkit-pro-cache-v2';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=192&h=192&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=512&h=512&q=80'
];

// On installation, pre-cache the absolute essentials (app shell)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching core application shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event handles cleaning up old caches and claiming clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting obsolete cache store:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Main fetch interceptor using customized hybrid offline strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests or browser extension/chrome-extension requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Strategy for root document, routes, and JSON files: Network-first
  // We prefer latest updates from network but fall back to cached shell immediately when offline
  if (
    url.pathname === '/' || 
    url.pathname === '/index.html' || 
    url.pathname.endsWith('.json') || 
    url.pathname.includes('/api/')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If response is valid, clone and update cache
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fall back to cache on failure
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Fall back specifically to root for spa navigations if possible
            if (url.pathname !== '/manifest.json') {
              return caches.match('/');
            }
          });
        })
    );
    return;
  }

  // Strategy for static assets (js, css, fonts, images): Stale-While-Revalidate or Cache-First
  // For static resources that are hashed or static, caching is extremely safe and fast
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (Stale-while-revalidate)
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Silence network failures under stale-while-revalidate update
          });
        return cachedResponse;
      }

      // If not in cache, fetch from network and cache for next time
      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Empty fallback response if network fails and completely offline with no cache
          return new Response('Offline: Resource not cached.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
    })
  );
});
