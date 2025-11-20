// Nombre de la caché. ¡INCREMENTA este número cada vez que modifiques los archivos o las rutas en urlsToCache!
const CACHE_NAME = 'tienda-online-v3'; 

// Lista completa de archivos locales y de CDN necesarios para que la app funcione offline.
const urlsToCache = [
  './',             // Asegura la carga de la raíz (index.html)
  'index.html',
  'manifest.json',      
  'service-worker.js',  
  'logo.jpg',
  // URLs de CDN críticas para la interfaz y gráficos
  'https://cdn.tailwindcss.com', 
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js', 
];


/* * 1. Evento 'install' ⚙️: Cachea todos los recursos esenciales.
 */
self.addEventListener('install', event => {
    console.log('[Service Worker] Instalando la versión:', CACHE_NAME);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // Abre el caché y añade todos los archivos listados (locales y CDN).
                return cache.addAll(urlsToCache); 
            })
            .then(() => self.skipWaiting()) // Fuerza la activación inmediata para tomar control
            .catch(error => {
                console.error('[Service Worker] Fallo en cache.addAll:', error);
            })
    );
});

/*
 * 2. Evento 'activate' 🧹: Limpia las cachés antiguas.
 */
self.addEventListener('activate', event => {
    console.log('[Service Worker] Limpiando cachés antiguas.');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Si el nombre de la caché no está en la lista blanca, la elimina.
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('[Service Worker] Eliminando caché obsoleta:', cacheName);
                        return caches.delete(cacheName); 
                    }
                })
            );
        })
    );
    // Asegura que el SW actual tome control inmediatamente después de la activación.
    return self.clients.claim(); 
});


/*
 * 3. Evento 'fetch' 📡: Estrategia 'Cache-First, luego Network'.
 */
self.addEventListener('fetch', event => {
    // Solo manejar peticiones GET y excluir extensiones del navegador.
    if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // 1. Si está en caché (offline), lo devolvemos inmediatamente.
                if (cachedResponse) {
                    return cachedResponse;
                }

                // 2. Si no está en caché, intentamos la red.
                return fetch(event.request).then(networkResponse => {
                    
                    // Comprobación de respuesta válida (status 200 y tipo básico, no opaco)
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    
                    // 3. Clonamos la respuesta para guardarla en caché y enviarla al navegador.
                    const responseToCache = networkResponse.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            // Guardamos el nuevo recurso en caché para futuras peticiones.
                            cache.put(event.request, responseToCache);
                        });

                    return networkResponse;
                }).catch(error => {
                    // 4. La red falló (el usuario está offline y no estaba en caché).
                    console.error('[Service Worker] Fallo en Fetch (Offline):', event.request.url, error);
                    // Opcional: Podrías devolver aquí una página de fallback específica.
                });
            })
    );
});