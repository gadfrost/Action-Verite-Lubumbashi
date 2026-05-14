const CACHE_NAME = 'action-verite-v1';
const ASSETS = [
  'index.html',
  'assets/style.css',
  'assets/script.js',
  'contenu/soft.json',
  'contenu/medium.json',
  'contenu/hard.json',
  'contenu/extreme.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
