/// <reference lib="webworker" />

// service-worker.js

const CACHE_NAME = 'webmail-v7';
const APP_SHELL_URLS = [
  '/',
  '/index.html'
];

self.addEventListener('install', (/** @type {ExtendableEvent} */ event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching App Shell');
      return cache.addAll(APP_SHELL_URLS);
    })
  );
});

self.addEventListener('activate', (/** @type {ExtendableEvent} */ event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (/** @type {FetchEvent} */ event) => {
  // Ignore API requests and let the browser handle them directly.
  if (event.request.url.includes('/api/')) {
    return; 
  }

  // Use a network-first strategy for navigation requests (the main HTML document).
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }
  
  // Use a cache-first, then network fallback with dynamic caching for all other requests.
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          // Only cache successful GET requests.
          if(event.request.method === 'GET' && fetchResponse.status === 200) {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        });
      });
    })
  );
});