/* ============================================================
   FRG-2024 ই-বুক — Service Worker (offline-first PWA)
   - Precaches the app shell, fonts, images on install
   - Background-caches the full 4.3 MB PDF after activation
   - Network-first for navigations (fresh content, offline fallback)
   - Stale-while-revalidate for same-origin assets
   ============================================================ */

const VERSION = 'frg-ebook-v3.1.7';
const CORE_CACHE = VERSION + '-core';
const RUNTIME_CACHE = VERSION + '-runtime';

const CORE_ASSETS = [
    './',
    './index.html',
    './css/reader.css',
    './js/content.js',
    './js/reader.js',
    './js/share.js',
    './js/tts.js',
    './js/analytics.js',
    './manifest.webmanifest',
    './favicon.png',
    './apple-touch-icon.png',
    './icon-192.png',
    './icon-512.png',
    './icon-maskable-192.png',
    './icon-maskable-512.png',
    './og-image.jpg',
    './assets/NotoSansBengali-Regular.ttf',
    './assets/NotoSansBengali-SemiBold.ttf',
    './assets/NotoSerifBengali-Regular.ttf',
    './assets/aez_map.jpg',
    './assets/cover_front.jpg',
    './assets/plate_9_L.jpg',
    './assets/plate_9_R.jpg',
    './assets/plate_10_L.jpg',
    './assets/plate_10_R.jpg',
];

/* Full book PDF — large, so cached in the background after activation */
const PDF_URL = './FRG-2024-ইবুক.pdf';

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CORE_CACHE);
        // Add individually so one 404 cannot break the whole install
        await Promise.all(CORE_ASSETS.map((u) => cache.add(u).catch(() => {})));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(
            keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
        );
        await self.clients.claim();
        // Background-fill the PDF (non-blocking)
        const cache = await caches.open(CORE_CACHE);
        await cache.add(PDF_URL).catch(() => {});
    })());
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET' || !req.url.startsWith('http')) return;
    const url = new URL(req.url);
    if (url.origin !== location.origin) return; // let cross-origin pass through

    // Navigations: network-first, offline → cached shell
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(RUNTIME_CACHE).then((c) => c.put('./index.html', copy));
                    return res;
                })
                .catch(() =>
                    caches.match(req).then((m) => m || caches.match('./index.html'))
                )
        );
        return;
    }

    // Same-origin assets: stale-while-revalidate
    event.respondWith(
        caches.match(req).then((cached) => {
            const fromNetwork = fetch(req)
                .then((res) => {
                    if (res && res.ok) {
                        const copy = res.clone();
                        caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
                    }
                    return res;
                })
                .catch(() => cached);
            return cached || fromNetwork;
        })
    );
});
