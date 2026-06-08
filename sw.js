const CACHE_NAME = 'action-verite-v2';
const ASSETS = [
  'index.html',
  'assets/style.css',
  'assets/script.js',
  'contenu/soft.json',
  'contenu/medium.json',
  'contenu/hard.json',
  'contenu/extreme.json'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => {
      // Force l'activation immédiate du nouveau SW
      self.skipWaiting();
    })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Supprimer les anciens caches
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Prendre le contrôle des clients immédiatement
      return self.clients.claim();
    })
  );
});

// Stratégie de fetch : Network-first pour les fichiers critiques, Cache-first pour les autres
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Pour les fichiers HTML, CSS, JS : Network-first (toujours chercher la dernière version)
  if (request.destination === 'document' || 
      request.url.includes('.css') || 
      request.url.includes('.js')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Mettre à jour le cache avec la nouvelle version
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Si la requête échoue, utiliser le cache
          return caches.match(request);
        })
    );
  } else {
    // Pour les autres ressources (JSON, images, etc.) : Cache-first
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((response) => {
          // Mettre en cache les nouvelles ressources
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
  }
});
