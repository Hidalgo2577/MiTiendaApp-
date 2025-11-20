// Nombre de la caché. Versión 2 de la PWA.
const CACHE_NAME = 'tienda-online-v2'; // <--- VERSIÓN INCREMENTADA

// **********************************************
// * RUTAS AJUSTADAS A TU PROYECTO *
// **********************************************
const urlsToCache = [
  '/',             // La raíz del ámbito
  'index.html',
  'manifest.json',      // <--- ¡AÑADIDO!
  'service-worker.js',  // <--- ¡AÑADIDO!
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
        // El fallo en 'cache.addAll' causaba el problema de instalación
        return cache.addAll(urlsToCache); 
      })
      .then(() => self.skipWaiting()) // Fuerza la activación inmediata
  );
});

/*
 * 2. Evento 'fetch': Estrategia 'Cache-First'
 * Intenta obtener el recurso de la caché; si no está, va a la red.
 */
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si hay una respuesta en caché, la devuelve.
        if (response) {
          return response;
        }

        // Si no hay respuesta, va a la red.
        return fetch(event.request).catch(error => {
          // Si la red falla y no está en caché, la página mostrará un error.
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
            return caches.delete(cacheName); // Elimina cachés antiguas
          }
        })
      );
    })
  );
});