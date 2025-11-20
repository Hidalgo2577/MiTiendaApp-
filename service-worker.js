// Nombre de la caché. Versión 1 de la PWA.
const CACHE_NAME = 'tienda-online-v1';

// AÑADIR manifest.json y service-worker.js a la lista de caché.
// Eliminar el './' para evitar redundancia si ya tienes index.html.
const urlsToCache = [
  'index.html',
  'manifest.json',      // <--- ¡Añadido!
  'service-worker.js',  // <--- ¡Añadido!
  'logo.jpg',
  // Nota: Si usas otros assets locales (como un archivo CSS propio), añádelos aquí.
  // Los CDN externos (Tailwind/Chart.js) no deben estar en esta lista para evitar fallos.
];

// ... (El resto del código de install, fetch y activate es correcto)