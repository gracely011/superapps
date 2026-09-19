// SuperTools High-Performance Service Worker (Cache-First / Stale-While-Revalidate)
// Menjamin durasi cache instan & efisien tanpa ketergantungan origin header server
const CACHE_NAME = 'supertools-v20260919_2335';
const STATIC_ASSETS = [
    './',
    './index.html',
    './js/app.js',
    './js/packer.js',
    './js/unpacker.js',
    './js/youtube-noads.js'
];

// Install: Simpan aset statis kritis ke CacheStorage
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// Activate: Bersihkan cache versi lama dan klaim kontrol client seketika
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Stale-While-Revalidate untuk aset lokal dan Google Fonts
self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // Prioritaskan aset lokal dan font
    if (url.origin === location.origin || url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(req).then((cachedResponse) => {
                    const fetchPromise = fetch(req).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(req, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => cachedResponse);

                    return cachedResponse || fetchPromise;
                });
            })
        );
    }
});
