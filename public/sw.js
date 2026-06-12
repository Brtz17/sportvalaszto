const CACHE_NAME = "sportvalaszto-v1";
const DEV_MODE = self.location.hostname === 'localhost' || 
                 self.location.hostname === '127.0.0.1';

const urlsToCache = [
    "/",
    "/index.html",
    "/style/index.css",
    "/js/index.js"
];

self.addEventListener("install", event => {
    if (DEV_MODE) return self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener("fetch", event => {
    if (DEV_MODE) return;
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});