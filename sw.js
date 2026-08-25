const CACHE_NAME = 'omnitrack-v1.0.14';
const ASSETS = ['./', './index.html', './sw.js', './manifest.json', './icon.svg'];

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

// Last resort when the network is gone and nothing usable is cached. Returning
// a real Response matters: resolving undefined would make respondWith() throw.
function offlineResponse() {
    return new Response('Offline, and no cached copy of this page is available.', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/plain' }
    });
}

self.addEventListener('fetch', event => {
    // Only GET requests are cacheable — cache.put() rejects on anything else —
    // so let the rest go straight to the network untouched.
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then(cached => {
            const networkFetch = fetch(event.request).then(response => {
                if (response && response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, copy))
                        .catch(e => console.warn('Cache write failed:', e));
                }
                return response;
            }).catch(() =>
                // Offline and uncached: fall back to the app shell, then to a
                // plain offline response if even the shell never got cached.
                cached ||
                caches.match('./')
                    .then(shell => shell || caches.match('./index.html'))
                    .then(shell => shell || offlineResponse())
                    .catch(() => offlineResponse())
            );
            return cached || networkFetch;
        }).catch(() => offlineResponse())
    );
});
