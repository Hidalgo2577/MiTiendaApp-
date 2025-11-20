// Nombre de la caché. Versión 1 de la PWA.
const CACHE_NAME = 'tienda-online-v1';

// **********************************************
// * RUTAS AJUSTADAS A TU PROYECTO *
// **********************************************
const urlsToCache = [
  './',             // La raíz, que carga index.html
  'index.html',
  // Archivos estáticos de tu proyecto
  'ccs/style.css',  // AJUSTADO: Asumiendo que tu archivo CSS está en ccs/style.css
  'logo.jpg',
  // Puedes añadir otros archivos JS/CSS si los tienes en las carpetas js/ y ccs/
  // 'js/tu-archivo-principal.js', 
  // 'ccs/otro-estilo.css'
];
// **********************************************


/* * 1. Evento 'install': Cachea los archivos estáticos listados.
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
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
          // Para un manejo más amigable, aquí se podría devolver una 'offline.html'
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
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});