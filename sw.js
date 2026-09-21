// SuperTools High-Performance Service Worker (Cache-First / Stale-While-Revalidate)
// Menjamin durasi cache instan & efisien tanpa ketergantungan origin header server
const CACHE_NAME = 'supertools-v20260921_2327';
const STATIC_ASSETS = [
    './',
    './index.html',
    './404.html',
    './assets/icon_192.png',
    './assets/icon_512.png',
    './js/app.js',
    './js/packer.js',
    './js/unpacker.js',
    './js/youtube-player.js',
    './js/suno-downloader.js',
    './js/legal-pages.js'
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

// Fetch: Stale-While-Revalidate untuk aset lokal dan Google Fonts Woff2 (fonts.gstatic.com)
self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    // SPA Navigation Fallback: Request navigasi halaman selalu dilayani instan dari cache index.html
    if (req.mode === 'navigate') {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match('./index.html').then((cachedIndex) => {
                    return cachedIndex || fetch(req).catch(() => caches.match('./index.html'));
                });
            })
        );
        return;
    }

    const url = new URL(req.url);

    // Prioritaskan aset lokal dan font biner statis (fonts.gstatic.com)
    if (url.origin === location.origin || url.hostname.includes('fonts.gstatic.com')) {
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
