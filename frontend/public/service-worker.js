const CACHE_NAME = 'tvin-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/tvin-logo.svg',
  '/empty-chat.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Стратегия: сначала кеш, потом сеть
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});