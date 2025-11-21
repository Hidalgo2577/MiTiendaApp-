// Nombre de la caché. ¡INCREMENTA este número cada vez que modifiques los archivos!
const CACHE_NAME = 'tienda-online-v4'; 

// Recursos que deben ser CACHE-FIRST y nunca cambiar (archivos locales principales)
const staticAssets = [
  './',             
  'index.html',
  'manifest.json',      
  'logo.jpg',
  // Archivo de fallback que se usará si todo lo demás falla
  'offline.html' 
];

// URLs de CDN críticas para la interfaz y gráficos (Strategy: Stale-While-Revalidate)
const cdnAssets = [
  'https://cdn.tailwindcss.com', 
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js', 
];

const urlsToCache = [...staticAssets, ...cdnAssets, 'service-worker.js'];

/* * 1. Evento 'install' ⚙️: Cachea todos los recursos esenciales y el fallback.
 */
self.addEventListener('install', event => {
    console.log('[Service Worker] Instalando la versión:', CACHE_NAME);
    event.waitUntil(
        // Pre-cachea todos los assets definidos
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache)) 
            .then(() => self.skipWaiting()) 
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
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('[Service Worker] Eliminando caché obsoleta:', cacheName);
                        return caches.delete(cacheName); 
                    }
                })
            );
        })
    );
    return self.clients.claim(); 
});


/*
 * 3. Evento 'fetch' 📡: Estrategia de manejo de recursos.
 */
self.addEventListener('fetch', event => {
    // Solo manejar peticiones GET y excluir extensiones
    if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) {
        return;
    }

    const url = event.request.url;

    // --- Estrategia 1: Stale-While-Revalidate para CDN/Recursos Externos ---
    // Mantiene la velocidad del Cache-First, pero revalida la caché en segundo plano.
    if (cdnAssets.includes(url)) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async cache => {
                // Intenta obtener de la caché primero (Stale)
                const cachedResponse = await cache.match(event.request);
                
                // Fetch de la red en segundo plano (Revalidate)
                const networkFetch = fetch(event.request).then(networkResponse => {
                    // Guarda o actualiza la caché (solo si la respuesta es válida y CORS)
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'cors') {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // Si el fetch falla (offline), el cachedResponse ya fue devuelto.
                });

                // Devuelve la caché inmediatamente si existe, si no, espera a la red.
                return cachedResponse || networkFetch;
            })
        );
        return;
    }

    // --- Estrategia 2: Cache-First, luego Network y Fallback (para el resto) ---
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // 1. Si está en caché, lo devolvemos inmediatamente.
                if (cachedResponse) {
                    return cachedResponse;
                }

                // 2. Si no está en caché, intentamos la red.
                return fetch(event.request).then(networkResponse => {
                    
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    
                    // 3. Clonamos y guardamos la respuesta de la red en caché.
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                }).catch(error => {
                    // 4. La red falló y no estaba en caché (Offline o error)
                    console.error('[Service Worker] Fallo en Fetch (Offline):', event.request.url, error);
                    
                    // Si la URL es una petición de navegación (HTML), devuelve la página de fallback
                    if (event.request.mode === 'navigate' || event.request.destination === 'document') {
                        return caches.match('offline.html'); 
                    }
                });
            })
    );
});