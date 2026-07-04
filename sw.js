const CACHE_NAME = 'omnitrack-v1.0.12';
const ASSETS = ['./', './index.html', './sw.js'];

self.addEventListener('install', event => {
    event.waitUntil(
        // allSettled so a single failed request (e.g. flaky network) doesn't
        // abort the whole install; runtime caching backfills anything missed.
        caches.open(CACHE_NAME).then(cache =>
            Promise.allSettled(ASSETS.map(asset => cache.add(asset)))
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cached => {
            const networkFetch = fetch(event.request).then(response => {
                if (response && response.ok) {
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
                }
                return response;
            }).catch(() =>
                // Offline and uncached: fall back to the app shell rather than
                // resolving undefined, which would make respondWith() throw.
                cached || caches.match('./')
            );
            return cached || networkFetch;
        })
    );
});
