// Nombre de la caché. Versión 2 de la PWA.
const CACHE_NAME = 'tienda-online-v2'; // <--- ¡INCREMENTADO!

// **********************************************
// * RUTAS AJUSTADAS A TU PROYECTO *
// **********************************************
const urlsToCache = [
  '/',             // La raíz del ámbito, que carga index.html
  'index.html',
  'manifest.json',      // <--- ¡AÑADIDO! (Crítico)
  'service-worker.js',  // <--- ¡AÑADIDO! (Crítico)
  // Archivo estático de tu proyecto
  'logo.jpg',
];

// **********************************************


/* * 1. Evento 'install': Cachea los archivos estáticos listados.
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Aseguramos que la lista incluye los archivos PWA
        return cache.addAll(urlsToCache); 
      })
      .then(() => self.skipWaiting()) // Fuerza la activación inmediata
  );
});

/*
 * 2. Evento 'fetch': Estrategia 'Cache-First'
 */
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(error => {
          console.error('Fetch fallido o sin conexión:', error);
        });
      })
  );
});

/*
 * 3. Evento 'activate': Limpia las cachés antiguas.
 */
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // Elimina cachés obsoletas
          }
        })
      );
    })
  );
});